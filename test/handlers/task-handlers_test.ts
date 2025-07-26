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

  const user: User = { _id: userId, username: "tes", password: "test" };
  const session: Session = { _id: sessionId, user_id: userId };
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

const createTask = (_id: number, description: string, done = false): Task => ({
  _id,
  description,
  done,
  todo_id: todoId,
  user_id: userId,
});

describe("handleAddTask", () => {
  it("should add a task and return task json", async () => {
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
    const expectedTaskJson: Task = {
      _id: 0,
      todo_id: await todoManager.addTodo(userId, "Test Todo"),
      user_id: userId,
      description: "Test Task",
      done: false,
    };
    const addTaskStub = stub(taskManager, "addTask", () => Promise.resolve(0));
    const getTaskStub = stub(
      taskManager,
      "getTaskById",
      () => Promise.resolve(expectedTaskJson),
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
      _id: 0,
      todo_id: todoId,
      user_id: userId,
      description: "Test Task",
      done: false,
    };
    assertEquals(jsonResponse, expectedTask);
    assertSpyCallArgs(addTaskStub, 0, [0, 0, "Test Task"]);
    assertSpyCallArgs(getTaskStub, 0, [0, 0, 0]);
  });

  it("should respond with 404 if todoId is not exist", async () => {
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
    const todoId = 0;
    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(false),
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );

    const todoId1 = await todoManager.addTodo(userId, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(userId, "Test Todo 2");

    const appContext = {
      todoManager,
      taskManager,
      sessionManager,
      userManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);
    const addTaskStub = stub(taskManager, "addTask", () => Promise.resolve(0));
    const getTaskStub = stub(
      taskManager,
      "getTaskById",
      (_todoId: number, taskId: number) =>
        Promise.resolve(
          taskId === 0
            ? createTask(0, `Test Task ${taskId + 1}`)
            : createTask(1, `Test Task ${taskId + 1}`),
        ),
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
    assertSpyCallArgs(addTaskStub, 0, [0, 0, "Test Task 1"]);
    assertSpyCallArgs(addTaskStub, 1, [0, 1, "Test Task 2"]);

    const jsonResponse1 = await response1.json();
    const jsonResponse2 = await response2.json();

    const expectedTask1: Task = createTask(0, "Test Task 1");
    const expectedTask2: Task = createTask(1, "Test Task 2");
    assertEquals(jsonResponse1, expectedTask1);
    assertEquals(jsonResponse2, expectedTask2);
    assertSpyCallArgs(getTaskStub, 0, [0, 0, 0]);
    assertSpyCallArgs(getTaskStub, 1, [0, 1, 0]);
  });

  it("should allow adding multiple tasks to a todo", async () => {
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
    const app = createApp(appContext);

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const nextId1 = idGenerator(0);
    const addTaskStub = stub(
      taskManager,
      "addTask",
      () => Promise.resolve(nextId1()),
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
    assertSpyCallArgs(addTaskStub, 0, [0, todoId, "Test Task 1"]);
    assertSpyCallArgs(addTaskStub, 1, [0, todoId, "Test Task 2"]);
    assertSpyCallArgs(getTaskStub, 0, [0, todoId, 0]);
    assertSpyCallArgs(getTaskStub, 1, [0, todoId, 1]);

    const jsonResponse1 = await response1.json();
    const jsonResponse2 = await response2.json();
    assertEquals(jsonResponse1, createTask(0, "Test Task 1"));
    assertEquals(jsonResponse2, createTask(1, "Test Task 2"));
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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

    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(false),
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
    const todoId = await todoManager.addTodo(0, "Test Todo");

    const app = createApp(appContext);

    const hasTaskStub = stub(
      taskManager,
      "hasTask",
      () => Promise.resolve(false),
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
    const todoId = await todoManager.addTodo(0, "Test Todo");
    const taskId = await taskManager.addTask(0, todoId, "Test Task");

    const toggleTaskStub = stub(
      taskManager,
      "toggleTaskDone",
      () => Promise.resolve(true),
    );
    const toggleTask = (
      (done: boolean = false) => () => {
        done = !done;
        return done;
      }
    )();

    const getTaskJsonStub = stub(
      taskManager,
      "getTaskById",
      () => Promise.resolve(createTask(taskId!, "Test Task", toggleTask())),
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

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const task1Id = await taskManager.addTask(0, todoId, "Task 1");
    const task2Id = await taskManager.addTask(0, todoId, "Task 2");

    const toggleTaskStub = stub(
      taskManager,
      "toggleTaskDone",
      () => Promise.resolve(true),
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

    const todoId1 = await todoManager.addTodo(0, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(0, "Test Todo 2");

    const task1Id = await taskManager.addTask(0, todoId1, "Task 1");
    const task2Id = await taskManager.addTask(0, todoId2, "Task 2");

    const toggleTaskStub = stub(
      taskManager,
      "toggleTaskDone",
      () => Promise.resolve(true),
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
});

describe("handleDeleteTask", () => {
  it("should respond with 404 if todo is not exist with the given todoId", async () => {
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
      userCollection,
    );
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
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

    const todoId = await todoManager.addTodo(userId, "Test Todo");
    const taskId = await taskManager.addTask(userId, todoId, "Test Task");

    const deleteTaskStub = stub(
      taskManager,
      "removeTask",
      () => Promise.resolve(true),
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

    const todoId1 = await todoManager.addTodo(0, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(0, "Test Todo 2");

    const task1Id = await taskManager.addTask(0, todoId1, "Task 1");
    const task2Id = await taskManager.addTask(0, todoId2, "Task 2");

    const deleteTaskStub = stub(
      taskManager,
      "removeTask",
      () => Promise.resolve(true),
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

    const todoId = await todoManager.addTodo(0, "Test Todo");
    const taskId = await taskManager.addTask(0, todoId, "Test Task");

    const deleteTaskStub = stub(
      taskManager,
      "removeTask",
      () => Promise.resolve(false),
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
});
