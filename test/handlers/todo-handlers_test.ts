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

let client: MongoClient;
let todoCollection: Collection<Todo>;
let taskCollection: Collection<Task>;
let userCollection: Collection<User>;
let sessionCollection: Collection<Session>;
const userId = 0;
const verify = () => false;

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
});

afterEach(async () => {
  await todoCollection.deleteMany({});
  await taskCollection.deleteMany({});
  await userCollection.deleteMany({});
  await sessionCollection.deleteMany({});

  await client.db("test").dropDatabase();
  await client.close();
});

const createTodo = (_id: number, title: string, user_id = userId): Todo => ({
  user_id,
  title,
  _id,
});

const silentLogger = () => {};
const testEncrypt = (password: string) => password;

describe("serveTodos", () => {
  it("should return all todos as json", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection,
    );
    const appContext = {
      todoManager,
      taskManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };

    const todo = createTodo(0, "Test Todo", 0);

    const todoManagerJSON = stub(
      todoManager,
      "getAllTodos",
      () => Promise.resolve([todo]),
    );

    const taskManagerJSON = stub(
      taskManager,
      "getAllTasks",
      () => Promise.resolve([]),
    );

    const todosJSON: TodoJSON[] = [
      {
        title: todo.title,
        user_id: todo.user_id,
        todo_id: todo._id,
        tasks: [],
      },
    ];

    const app = createApp(appContext);
    const response = await app.request("/todos");

    assertEquals(response.status, 200);
    assertSpyCallArgs(todoManagerJSON, 0, [0]);
    assertSpyCallArgs(taskManagerJSON, 0, [0, 0]);
    assertEquals(await response.json(), todosJSON);
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );
    const appContext = {
      todoManager,
      taskManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };

    const todoManagerAdd = stub(
      todoManager,
      "addTodo",
      () => Promise.resolve(0),
    );
    const todoManagerGet = stub(
      todoManager,
      "getTodoById",
      () => Promise.resolve(createTodo(0, "New Todo", userId)),
    );
    const taskManagerGet = stub(
      taskManager,
      "getAllTasks",
      () => Promise.resolve([]),
    );

    const app = createApp(appContext);
    const title = "New Todo";
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: { "Content-Type": "application/json" },
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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
    const todoManagerGet = stub(
      todoManager,
      "getTodoById",
      (_userId, todoId) => Promise.resolve(todoId === 0 ? todo1 : todo2),
    );
    const app = createApp(appContext);

    // Add first todo
    const response1 = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "First Todo" }),
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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
      headers: { "Content-Type": "application/json" },
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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
      headers: { "Content-Type": "application/json" },
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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
      headers: { "Content-Type": "application/json" },
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title should not be empty.");
  });
});
