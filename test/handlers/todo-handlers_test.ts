import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import createApp from "../../src/app.ts";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assertEquals } from "@std/assert/equals";
import { assertSpyCallArgs, stub } from "@std/testing/mock";
import { Collection, MongoClient } from "mongodb";
import { Session, Task, Todo, TodoJSON, User } from "../../src/types.ts";
import { TaskManager } from "../../src/models/task-manager.ts";
import { UserManager } from "../../src/models/user-manager.ts";
import { SessionManager } from "../../src/models/session-manager.ts";
import { assertObjectMatch } from "@std/assert";

let client: MongoClient;
let todoCollection: Collection<Todo>;
let taskCollection: Collection<Task>;
let userCollection: Collection<User>;
let sessionCollection: Collection<Session>;
const userId = 0;
const sessionId = 0;
const verify = () => Promise.resolve(false);

beforeEach(async () => {
  client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const database = client.db("test");
  todoCollection = database.collection("todos");
  taskCollection = database.collection("tasks");
  userCollection = database.collection("users");
  sessionCollection = database.collection("sessions");

  await todoCollection.deleteMany({});
  await taskCollection.deleteMany({});
  await userCollection.deleteMany({});
  await sessionCollection.deleteMany({});

  const user: User = { user_id: userId, username: "test", password: "test" };
  const session: Session = { session_id: sessionId, user_id: userId };
  await userCollection.insertOne(user);
  await sessionCollection.insertOne(session);
});

afterEach(async () => {
  await todoCollection.deleteMany({});
  await taskCollection.deleteMany({});
  await userCollection.deleteMany({});
  await sessionCollection.deleteMany({});

  await client.db("test").dropDatabase();
  await client.close();
});

const createTodo = (
  todo_id: number,
  title: string,
  user_id = userId
): Todo => ({
  user_id,
  title,
  todo_id,
});

const createTask = (
  task_id: number,
  description: string,
  done = false,
  todo_id = 0,
  user_id = 0
): Task => ({
  task_id,
  description,
  done,
  todo_id,
  user_id,
});

const silentLogger = () => {};
const testEncrypt = (password: string) => Promise.resolve(password);

describe("serveTodos", () => {
  it("should return all todos as json", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };

    const todo = createTodo(0, "Test Todo", 0);

    const todoManagerJSON = stub(todoManager, "getAllTodos", () =>
      Promise.resolve([todo])
    );

    const taskManagerJSON = stub(taskManager, "getAllTasks", () =>
      Promise.resolve([])
    );

    const todosJSON: TodoJSON[] = [
      {
        title: todo.title,
        user_id: todo.user_id,
        todo_id: todo.todo_id,
        tasks: [],
      },
    ];

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 200);
    assertSpyCallArgs(todoManagerJSON, 0, [0]);
    assertSpyCallArgs(taskManagerJSON, 0, [0, 0]);
    assertEquals(await response.json(), todosJSON);
  });

  it("should return all todos of any user as json", async () => {
    const idGenerator = (start: number) => () => start++;
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const taskManager = TaskManager.init(idGenerator(0), taskCollection);
    const userManager = UserManager.init(
      idGenerator(0),
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      idGenerator(0),
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    // User-1
    const userId1 = await userManager.createUser("User-1", "Password-1");
    const sessionId1 = await sessionManager.createSession(userId1);
    const todoId1 = await todoManager.addTodo(userId1, "First Todo");
    const todoId2 = await todoManager.addTodo(userId1, "Second Todo");
    const todo1 = createTodo(todoId1, "First Todo", userId1);
    const todo2 = createTodo(todoId2, "Second Todo", userId1);

    const response1 = await app.request("/todos", {
      headers: { Cookie: `sessionId=${sessionId1}` },
    });
    assertEquals(response1.status, 200);
    const todosJSON1: TodoJSON[] = [
      { ...todo1, tasks: [] },
      { ...todo2, tasks: [] },
    ];
    assertEquals(await response1.json(), todosJSON1);

    const taskId1 = await taskManager.addTask(userId1, todoId1, "Task-1");

    const response2 = await app.request("/todos", {
      headers: { Cookie: `sessionId=${sessionId1}` },
    });
    assertEquals(response2.status, 200);

    assertObjectMatch((await response2.json())[0], {
      ...todo1,
      tasks: [createTask(taskId1!, "Task-1", false, todoId1, userId1)],
    });

    const userId2 = await userManager.createUser("user2", "password");
    const sessionId2 = await sessionManager.createSession(userId2);
    const todoId3 = await todoManager.addTodo(userId2, "Third Todo");
    const todo3 = createTodo(todoId3, "Third Todo", 1);

    const response3 = await app.request("/todos", {
      headers: { Cookie: `sessionId=${sessionId2}` },
    });
    assertEquals(response3.status, 200);
    const todosJSON3: TodoJSON[] = [{ ...todo3, tasks: [] }];
    assertEquals(await response3.json(), todosJSON3);

    const taskId2 = await taskManager.addTask(userId2, todoId3, "Task-2");
    const response4 = await app.request("/todos", {
      headers: { Cookie: `sessionId=${sessionId2}` },
    });
    assertEquals(response4.status, 200);

    assertObjectMatch((await response4.json())[0], {
      ...todo3,
      tasks: [createTask(taskId2!, "Task-2", false, todoId3, userId2)],
    });
  });
});

describe("handleAddTodo", () => {
  it("should add a new todo and return it as json", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };

    const todoManagerAdd = stub(todoManager, "addTodo", () =>
      Promise.resolve(0)
    );
    const todoManagerGet = stub(todoManager, "getTodoById", () =>
      Promise.resolve(createTodo(0, "New Todo", userId))
    );
    const taskManagerGet = stub(taskManager, "getAllTasks", () =>
      Promise.resolve([])
    );

    const app = createApp(appContext);
    const title = "New Todo";
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 201);
    assertSpyCallArgs(todoManagerAdd, 0, [0, title]);

    const todoJson = await response.json();
    assertSpyCallArgs(todoManagerGet, 0, [0, 0]);
    assertSpyCallArgs(taskManagerGet, 0, [0, 0]);
    assertEquals(todoJson, { todo_id: 0, user_id: 0, title, tasks: [] });
  });

  it("should able to add multiple todos", async () => {
    const idGenerator = (start: number) => () => start++;
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const taskManager = TaskManager.init(idGenerator(0), taskCollection);
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };

    const todo1 = createTodo(0, "First Todo", 0);
    const todo2 = createTodo(1, "Second Todo", 0);
    const todoManagerAdd = stub(todoManager, "addTodo", (_id, title) => {
      return Promise.resolve(title === "First Todo" ? 0 : 1);
    });
    const todoManagerGet = stub(todoManager, "getTodoById", (_userId, todoId) =>
      Promise.resolve(todoId === 0 ? todo1 : todo2)
    );
    const app = createApp(appContext);

    // Add first todo
    const response1 = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "First Todo" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response1.status, 201);
    assertSpyCallArgs(todoManagerAdd, 0, [0, "First Todo"]);
    const todoJSON1 = await response1.json();
    const expectedJSON1 = {
      todo_id: 0,
      user_id: 0,
      title: "First Todo",
      tasks: [],
    };
    assertEquals(todoJSON1, expectedJSON1);
    assertSpyCallArgs(todoManagerGet, 0, [0, 0]);

    // Add second todo
    const response2 = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Second Todo" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response2.status, 201);
    assertSpyCallArgs(todoManagerAdd, 1, [0, "Second Todo"]);
    const todoJSON2 = await response2.json();
    const expectedJSON2: TodoJSON = {
      todo_id: 1,
      user_id: 0,
      title: "Second Todo",
      tasks: [],
    };
    assertEquals(todoJSON2, expectedJSON2);
    assertSpyCallArgs(todoManagerGet, 1, [0, 1]);
  });

  it("should return 400 if title is missing", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title is required");
  });

  it("should return 400 if title is not a string", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: 123 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title must be a string.");
  });

  it("should return 400 if title is empty string", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title should not be empty.");
  });

  it("should return 400 if title is empty after trim", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "   " }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title should not be empty.");
  });

  it("should able to add todo for different users", async () => {
    const idGenerator = (start: number) => () => start++;
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const taskManager = TaskManager.init(idGenerator(0), taskCollection);
    const userManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection
    );
    const sessionManager = SessionManager.init(
      () => 1,
      sessionCollection,
      userCollection
    );
    const appContext = {
      todoManager,
      taskManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const todo1 = createTodo(0, "First Todo", 0);
    const todo2 = createTodo(1, "Second Todo", 0);
    const todo3 = createTodo(2, "Third Todo", 1);

    const taskManagerGet = stub(taskManager, "getAllTasks", () =>
      Promise.resolve([])
    );

    // Add first todo for userId 0
    const response1 = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "First Todo" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response1.status, 201);
    const todoJSON1 = await response1.json();
    assertEquals(todoJSON1, { ...todo1, tasks: [] });
    assertSpyCallArgs(taskManagerGet, 0, [0, 0]);

    // Add second todo for userId 0
    const response2 = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Second Todo" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response2.status, 201);
    const todoJSON2 = await response2.json();
    assertEquals(todoJSON2, { ...todo2, tasks: [] });
    assertSpyCallArgs(taskManagerGet, 1, [0, 1]);

    // Create a new user and add a todo for that user
    const userId2 = await userManager.createUser("user2", "password");
    const sessionId2 = await sessionManager.createSession(userId2);

    const response3 = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Third Todo" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId2}`,
      },
    });
    assertEquals(response3.status, 201);
    const todoJSON3 = await response3.json();
    assertEquals(todoJSON3, { ...todo3, tasks: [] });
    assertSpyCallArgs(taskManagerGet, 2, [1, 2]);
  });
});
