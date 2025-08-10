import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import createApp from "../../src/app.ts";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assertEquals } from "@std/assert/equals";
import { assertSpyCallArgs, stub } from "@std/testing/mock";
import { Session, Task, Todo, User } from "../../src/types.ts";
import { Collection, MongoClient } from "mongodb";
import { TaskManager } from "../../src/models/task-manager.ts";
import { UserManager } from "../../src/models/user-manager.ts";
import { SessionManager } from "../../src/models/session-manager.ts";

let client: MongoClient;
let todoCollection: Collection<Todo>;
let taskCollection: Collection<Task>;
let userCollection: Collection<User>;
let sessionCollection: Collection<Session>;
const userId = 0;
const sessionId = 0;
const todoId = 0;

const silentLogger = () => {};
const testEncrypt = (password: string) => Promise.resolve(password);
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

  const user: User = { user_id: userId, username: "tes", password: "test" };
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

const createTask = (
  task_id: number,
  description: string,
  done = false,
  todo_id = todoId,
  user_id = userId,
  priority = 0
): Task => ({
  task_id,
  description,
  done,
  priority,
  todo_id,
  user_id,
});

describe("handleAddTask", () => {
  it("should add a task and return task json", async () => {
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
    const expectedTaskJson: Task = {
      task_id: 0,
      todo_id: await todoManager.addTodo(userId, "Test Todo"),
      user_id: userId,
      description: "Test Task",
      done: false,
      priority: 0,
    };
    const addTaskStub = stub(taskManager, "addTask", () => Promise.resolve(0));
    const getTaskStub = stub(taskManager, "getTaskById", () =>
      Promise.resolve(expectedTaskJson)
    );
    const app = createApp(appContext);
    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });
    assertEquals(response.status, 201);
    const jsonResponse = await response.json();
    const expectedTask: Task = {
      task_id: 0,
      todo_id: todoId,
      user_id: userId,
      description: "Test Task",
      done: false,
      priority: 0,
    };
    assertEquals(jsonResponse, expectedTask);
    assertSpyCallArgs(addTaskStub, 0, [userId, todoId, "Test Task", undefined]);
    assertSpyCallArgs(getTaskStub, 0, [userId, todoId, 0]);
  });

  it("should respond with 404 if todoId is not exist", async () => {
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
    const todoId = 0;
    const hasTodoStub = stub(todoManager, "hasTodo", () =>
      Promise.resolve(false)
    );
    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test task", todoId: 0 }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });
    assertEquals(response.status, 404);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, { message: "Todo is not exist!" });
    assertSpyCallArgs(hasTodoStub, 0, [0, 0]);
  });

  it("should allow adding task to any todo", async () => {
    const idGenerator = (start: number) => () => start++;
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
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

    const todoId1 = await todoManager.addTodo(userId, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(userId, "Test Todo 2");

    const nextId = idGenerator(0);
    const addTaskStub = stub(taskManager, "addTask", () =>
      Promise.resolve(nextId())
    );
    const getTaskStub = stub(
      taskManager,
      "getTaskById",
      (_todoId: number, taskId: number) =>
        Promise.resolve(
          taskId === 0
            ? createTask(0, `Test Task ${taskId + 1}`)
            : createTask(1, `Test Task ${taskId + 1}`)
        )
    );
    const response1 = await app.request(`/todos/${todoId1}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task 1" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });
    const response2 = await app.request(`/todos/${todoId2}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task 2" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response1.status, 201);
    assertEquals(response2.status, 201);

    const expectedArgs1 = [userId, todoId1, "Test Task 1", undefined];
    const expectedArgs2 = [userId, todoId2, "Test Task 2", undefined];
    assertSpyCallArgs(addTaskStub, 0, expectedArgs1);
    assertSpyCallArgs(addTaskStub, 1, expectedArgs2);

    assertSpyCallArgs(getTaskStub, 0, [userId, todoId1, 0]);
    assertSpyCallArgs(getTaskStub, 1, [userId, todoId2, 1]);

    const jsonResponse1 = await response1.json();
    const jsonResponse2 = await response2.json();

    const expectedTask1: Task = createTask(0, "Test Task 1");
    const expectedTask2: Task = createTask(1, "Test Task 2");
    assertEquals(jsonResponse1, expectedTask1);
    assertEquals(jsonResponse2, expectedTask2);
  });

  it("should allow adding multiple tasks to a todo", async () => {
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
    const app = createApp(appContext);

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const nextId1 = idGenerator(0);
    const addTaskStub = stub(taskManager, "addTask", () =>
      Promise.resolve(nextId1())
    );

    const nextId2 = idGenerator(0);

    const getTaskStub = stub(taskManager, "getTaskById", () => {
      const id = nextId2();
      return Promise.resolve(createTask(id, `Test Task ${id + 1}`));
    });
    const response1 = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task 1" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });
    const response2 = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task 2" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });
    assertEquals(response1.status, 201);
    assertEquals(response2.status, 201);
    const expectedArgs1 = [0, todoId, "Test Task 1", undefined];
    const expectedArgs2 = [0, todoId, "Test Task 2", undefined];
    assertSpyCallArgs(addTaskStub, 0, expectedArgs1);
    assertSpyCallArgs(addTaskStub, 1, expectedArgs2);
    assertSpyCallArgs(getTaskStub, 0, [0, todoId, 0]);
    assertSpyCallArgs(getTaskStub, 1, [0, todoId, 1]);

    const jsonResponse1 = await response1.json();
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse1, createTask(0, "Test Task 1"));
    assertEquals(jsonResponse2, createTask(1, "Test Task 2"));
  });

  it("should allow adding tasks of any users", async () => {
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
      sessionManager,
      userManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const nextId1 = idGenerator(0);
    const addTaskStub = stub(taskManager, "addTask", () =>
      Promise.resolve(nextId1())
    );
    const nextId2 = idGenerator(0);
    const getTaskStub = stub(taskManager, "getTaskById", () => {
      const id = nextId2();
      return Promise.resolve(createTask(id, `User ${id + 1} Task`));
    });

    const userId1 = await userManager.createUser("user1", "password1");
    const todoId1 = await todoManager.addTodo(userId1, "User 1 Todo");
    const sessionId1 = await sessionManager.createSession(userId1);

    const response1 = await app.request(`/todos/${todoId1}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "User 1 Task" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId1}`,
      },
    });

    assertEquals(response1.status, 201);
    const expectedArgs1 = [userId1, todoId1, "User 1 Task", undefined];
    assertSpyCallArgs(addTaskStub, 0, expectedArgs1);
    assertSpyCallArgs(getTaskStub, 0, [userId1, todoId1, 0]);
    const jsonResponse1 = await response1.json();
    assertEquals(jsonResponse1, createTask(0, "User 1 Task"));

    const userId2 = await userManager.createUser("user2", "password2");
    const todoId2 = await todoManager.addTodo(userId2, "User 2 Todo");
    const sessionId2 = await sessionManager.createSession(userId2);

    const response2 = await app.request(`/todos/${todoId2}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "User 2 Task" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId2}`,
      },
    });

    assertEquals(response2.status, 201);
    const expectedArgs2 = [userId2, todoId2, "User 2 Task", undefined];
    assertSpyCallArgs(addTaskStub, 1, expectedArgs2);
    assertSpyCallArgs(getTaskStub, 1, [userId2, todoId2, 1]);
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse2, createTask(1, "User 2 Task"));
  });

  it("should allow adding tasks with priority", async () => {
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
    const app = createApp(appContext);

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const taskDescription = "Test Task with Priority";
    const taskPriority = 5;

    const addTaskStub = stub(taskManager, "addTask", () => Promise.resolve(0));
    const getTaskStub = stub(taskManager, "getTaskById", () =>
      Promise.resolve(
        createTask(0, taskDescription, false, todoId, userId, taskPriority)
      )
    );

    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        description: taskDescription,
        priority: taskPriority,
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 201);
    const expectedArgs = [userId, todoId, taskDescription, taskPriority];
    assertSpyCallArgs(addTaskStub, 0, expectedArgs);
    assertSpyCallArgs(getTaskStub, 0, [userId, todoId, 0]);

    const jsonResponse = await response.json();
    assertEquals(
      jsonResponse,
      createTask(0, taskDescription, false, todoId, userId, taskPriority)
    );
  });

  it("should respond with 400 if priority is not a number", async () => {
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

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        description: "Test Task",
        priority: "high", // Invalid priority
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionId=${sessionId}`,
      },
    });

    assertEquals(response.status, 400);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, { message: "Priority must be a number!" });
  });
});

describe("handleToggleTask", () => {
  it("should respond with 404 if todo is not exist with the given todoId", async () => {
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
    const todoId = 0;
    const taskId = 0;

    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Todo is not exist!" });
  });

  it("should respond with 404 if task is not exist with the given todoId", async () => {
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

    const hasTodoStub = stub(todoManager, "hasTodo", () =>
      Promise.resolve(false)
    );

    const response = await app.request(`/todos/${todoId}/tasks/0`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 404);

    assertSpyCallArgs(hasTodoStub, 0, [0, todoId]);

    const jsonResponse = await response.json();
    assertEquals(jsonResponse, { message: "Todo is not exist!" });
  });

  it("should respond with 404 if task is not exist with the given todoId and taskId", async () => {
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
    const todoId = await todoManager.addTodo(0, "Test Todo");

    const app = createApp(appContext);

    const hasTaskStub = stub(taskManager, "hasTask", () =>
      Promise.resolve(false)
    );

    const response = await app.request(`/todos/${todoId}/tasks/999`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 404);
    assertSpyCallArgs(hasTaskStub, 0, [0, todoId, 999]);

    const jsonResponse = await response.json();
    assertEquals(jsonResponse, { message: "Task is not exist!" });
  });

  it("should return task if task status toggled successfully", async () => {
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
    const todoId = await todoManager.addTodo(0, "Test Todo");
    const taskId = await taskManager.addTask(0, todoId, "Test Task");

    const toggleTaskStub = stub(taskManager, "toggleTaskDone", () =>
      Promise.resolve(true)
    );
    const toggleTask = (
      (done: boolean = false) =>
      () => {
        done = !done;
        return done;
      }
    )();

    const getTaskJsonStub = stub(taskManager, "getTaskById", () =>
      Promise.resolve(createTask(taskId!, "Test Task", toggleTask()))
    );

    const app = createApp(appContext);

    const response1 = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response1.status, 200);
    assertSpyCallArgs(toggleTaskStub, 0, [0, todoId, taskId]);
    assertSpyCallArgs(getTaskJsonStub, 0, [0, todoId, taskId]);
    const jsonResponse = await response1.json();
    assertEquals(jsonResponse, createTask(taskId!, "Test Task", true));

    // Simulate a second toggle to ensure the task can be toggled back
    const response2 = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });
    assertEquals(response2.status, 200);
    assertSpyCallArgs(toggleTaskStub, 1, [0, todoId, taskId]);
    assertSpyCallArgs(getTaskJsonStub, 1, [0, todoId, taskId]);
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse2, createTask(taskId!, "Test Task", false));
  });

  it("should able to toggle multiple tasks", async () => {
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
    const app = createApp(appContext);

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const task1Id = await taskManager.addTask(0, todoId, "Task 1");
    const task2Id = await taskManager.addTask(0, todoId, "Task 2");

    const toggleTaskStub = stub(taskManager, "toggleTaskDone", () =>
      Promise.resolve(true)
    );
    const nextId = idGenerator(0);
    const getTaskStub = stub(taskManager, "getTaskById", () => {
      const taskId = nextId();
      return Promise.resolve(createTask(taskId, `Task ${taskId + 1}`));
    });

    // Toggle first task
    const response1 = await app.request(`/todos/${todoId}/tasks/${task1Id}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });
    assertEquals(response1.status, 200);
    assertSpyCallArgs(toggleTaskStub, 0, [0, todoId, task1Id]);
    assertSpyCallArgs(getTaskStub, 0, [0, todoId, task1Id]);
    const jsonResponse1 = await response1.json();
    assertEquals(jsonResponse1, createTask(task1Id!, `Task ${task1Id! + 1}`));

    // Toggle second task
    const response2 = await app.request(`/todos/${todoId}/tasks/${task2Id}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response2.status, 200);
    assertSpyCallArgs(toggleTaskStub, 1, [0, todoId, task2Id]);
    assertSpyCallArgs(getTaskStub, 1, [0, todoId, task2Id]);
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse2, createTask(task2Id!, `Task ${task2Id! + 1}`));
  });

  it("should allow toggling task done status for any todo", async () => {
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
    const app = createApp(appContext);

    const todoId1 = await todoManager.addTodo(0, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(0, "Test Todo 2");

    const task1Id = await taskManager.addTask(0, todoId1, "Task 1");
    const task2Id = await taskManager.addTask(0, todoId2, "Task 2");

    const toggleTaskStub = stub(taskManager, "toggleTaskDone", () =>
      Promise.resolve(true)
    );
    const nextId = idGenerator(0);
    const getTaskStub = stub(taskManager, "getTaskById", () => {
      const taskId = nextId();
      return Promise.resolve(createTask(taskId, `Task ${taskId + 1}`));
    });

    // Toggle first task
    const response1 = await app.request(`/todos/${todoId1}/tasks/${task1Id}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });
    assertEquals(response1.status, 200);
    assertSpyCallArgs(toggleTaskStub, 0, [0, todoId1, task1Id]);
    assertSpyCallArgs(getTaskStub, 0, [0, todoId1, task1Id]);
    const jsonResponse1 = await response1.json();
    assertEquals(jsonResponse1, createTask(task1Id!, `Task ${task1Id! + 1}`));

    // Toggle second task
    const response2 = await app.request(`/todos/${todoId2}/tasks/${task2Id}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId}` },
    });
    assertEquals(response2.status, 200);
    assertSpyCallArgs(toggleTaskStub, 1, [0, todoId2, task2Id]);
    assertSpyCallArgs(getTaskStub, 1, [0, todoId2, task2Id]);
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse2, createTask(task2Id!, `Task ${task2Id! + 1}`));
  });

  it("should able to toggle task done status for any user", async () => {
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
      sessionManager,
      userManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const toggleTaskStub = stub(taskManager, "toggleTaskDone", () =>
      Promise.resolve(true)
    );

    const task1 = createTask(0, "Task-1", true, 0, 0);
    const task2 = createTask(1, "Task-2", true, 1, 1);

    const getTaskStub = stub(taskManager, "getTaskById", (userId) =>
      userId === 0 ? Promise.resolve(task1) : Promise.resolve(task2)
    );

    // Checking toggle task done status for User 1
    const userId1 = await userManager.createUser("User1", "Password1");
    const sessionId1 = await sessionManager.createSession(userId1);
    const todoId1 = await todoManager.addTodo(userId1, "Todo-1");
    const taskId1 = await taskManager.addTask(userId1, todoId1, "Task-1");

    const response1 = await app.request(`todos/${todoId1}/tasks/${taskId1}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId1}` },
    });

    assertEquals(response1.status, 200);
    assertSpyCallArgs(toggleTaskStub, 0, [userId1, todoId1, taskId1]);
    assertSpyCallArgs(getTaskStub, 0, [userId1, todoId1, taskId1]);
    const jsonResponse1 = await response1.json();
    assertEquals(
      jsonResponse1,
      createTask(taskId1!, "Task-1", true, todoId1, userId1)
    );

    // Checking toggle task done status for User 2
    const userId2 = await userManager.createUser("User2", "Password2");
    const sessionId2 = await sessionManager.createSession(userId2);
    const todoId2 = await todoManager.addTodo(userId2, "Todo-2");
    const taskId2 = await taskManager.addTask(userId2, todoId2, "Task-2");

    const response2 = await app.request(`todos/${todoId2}/tasks/${taskId2}`, {
      method: "PATCH",
      headers: { Cookie: `sessionId=${sessionId2}` },
    });

    assertEquals(response2.status, 200);
    assertSpyCallArgs(toggleTaskStub, 1, [userId2, todoId2, taskId2]);
    assertSpyCallArgs(getTaskStub, 1, [userId2, todoId2, taskId2]);
    const jsonResponse2 = await response2.json();
    assertEquals(
      jsonResponse2,
      createTask(taskId2!, "Task-2", true, todoId2, userId2)
    );
  });
});

describe("handleDeleteTask", () => {
  it("should respond with 404 if todo is not exist with the given todoId", async () => {
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

    const todoId = 0;
    const taskId = 0;

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Todo is not exist!" });
  });

  it("should respond with 404 if task is not exist with the given todoId and taskId", async () => {
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
    const todoId = await todoManager.addTodo(userId, "Test Todo");

    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/0`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Task is not exist!" });
  });

  it("should delete task and return true if deleted successfully", async () => {
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

    const todoId = await todoManager.addTodo(userId, "Test Todo");
    const taskId = await taskManager.addTask(userId, todoId, "Test Task");

    const deleteTaskStub = stub(taskManager, "removeTask", () =>
      Promise.resolve(true)
    );

    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 200);
    assertSpyCallArgs(deleteTaskStub, 0, [userId, todoId, taskId]);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, true);
  });

  it("should allow deleting tasks from any todo", async () => {
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
    const app = createApp(appContext);

    const todoId1 = await todoManager.addTodo(0, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(0, "Test Todo 2");

    const task1Id = await taskManager.addTask(0, todoId1, "Task 1");
    const task2Id = await taskManager.addTask(0, todoId2, "Task 2");

    const deleteTaskStub = stub(taskManager, "removeTask", () =>
      Promise.resolve(true)
    );

    // Delete first task
    const response1 = await app.request(`/todos/${todoId1}/tasks/${task1Id}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId}` },
    });
    assertEquals(response1.status, 200);
    assertSpyCallArgs(deleteTaskStub, 0, [0, todoId1, task1Id]);
    const jsonResponse1 = await response1.json();
    assertEquals(jsonResponse1, true);

    // Delete second task
    const response2 = await app.request(`/todos/${todoId2}/tasks/${task2Id}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId}` },
    });
    assertEquals(response2.status, 200);
    assertSpyCallArgs(deleteTaskStub, 1, [0, todoId2, task2Id]);
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse2, true);
  });

  it("should return removeTask result after deleting task", async () => {
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
    const app = createApp(appContext);

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const taskId = await taskManager.addTask(0, todoId, "Test Task");

    const deleteTaskStub = stub(taskManager, "removeTask", () =>
      Promise.resolve(false)
    );

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId}` },
    });

    assertEquals(response.status, 200);
    assertSpyCallArgs(deleteTaskStub, 0, [0, todoId, taskId]);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, false);
  });

  it("should allow deleting tasks from any user", async () => {
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
      sessionManager,
      userManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const removeTaskStub = stub(taskManager, "removeTask", () =>
      Promise.resolve(true)
    );

    // Checking task deletion for user 1
    const userId1 = await userManager.createUser("User-1", "Password");
    const sessionId1 = await sessionManager.createSession(userId1);
    const todoId1 = await todoManager.addTodo(userId1, "Todo-1");
    const taskId1 = await taskManager.addTask(userId1, todoId1, "Task-1");

    const response1 = await app.request(`/todos/${todoId1}/tasks/${taskId1}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId1}` },
    });

    assertEquals(response1.status, 200);
    assertSpyCallArgs(removeTaskStub, 0, [userId1, todoId1, taskId1]);
    assertEquals(await response1.json(), true);

    // Checking task deletion for user 2
    const userId2 = await userManager.createUser("User-2", "Password");
    const sessionId2 = await sessionManager.createSession(userId2);
    const todoId2 = await todoManager.addTodo(userId2, "Todo-2");
    const taskId2 = await taskManager.addTask(userId2, todoId2, "Task-2");

    const response2 = await app.request(`/todos/${todoId2}/tasks/${taskId2}`, {
      method: "DELETE",
      headers: { Cookie: `sessionId=${sessionId2}` },
    });

    assertEquals(response2.status, 200);
    assertSpyCallArgs(removeTaskStub, 1, [userId2, todoId2, taskId2]);
    assertEquals(await response2.json(), true);
  });
});
