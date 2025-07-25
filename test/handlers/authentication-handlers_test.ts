import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import createApp from "../../src/app.ts";
import { AppContext, Session, Task, Todo, User } from "../../src/types.ts";
import { TaskManager } from "../../src/models/task-manager.ts";
import { Collection, MongoClient } from "mongodb";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assertEquals } from "@std/assert";
import { UserManager } from "../../src/models/user-manager.ts";
import { SessionManager } from "../../src/models/session-manager.ts";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

let client: MongoClient;
let todoCollection: Collection<Todo>;
let taskCollection: Collection<Task>;
let userCollection: Collection<User>;
let sessionCollection: Collection<Session>;

const silentLogger = () => {};
const verify = () => false;

beforeEach(async () => {
  client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const database = client.db("test");
  todoCollection = await database.createCollection("todos");
  taskCollection = await database.createCollection("tasks");
  userCollection = await database.createCollection("users");
  sessionCollection = await database.createCollection("sessions");

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

const testEncrypt = (password: string) => password;

describe("sign-up", () => {
  it("should throw an error if username or password is missing", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const emptyBodyReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Empty body
    });

    const response1 = await app.request(emptyBodyReq);
    assertEquals(response1.status, 400);
    assertEquals(await response1.json(), {
      message: "Username and password are required",
    });

    const noUsernameReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "password123" }), // Missing username
    });
    const response2 = await app.request(noUsernameReq);
    assertEquals(response2.status, 400);
    assertEquals(await response2.json(), {
      message: "Username and password are required",
    });

    const noPasswordReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1" }), // Missing password
    });
    const response3 = await app.request(noPasswordReq);
    assertEquals(response3.status, 400);
    assertEquals(await response3.json(), {
      message: "Username and password are required",
    });
  });

  it("should return 400 if username or password is empty", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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

    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const emptyUsernameReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "", password: "password123" }),
    });
    const response1 = await app.request(emptyUsernameReq);
    assertEquals(response1.status, 400);
    assertEquals(await response1.json(), {
      message: "Username and password cannot be empty!",
    });

    const emptyPasswordReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "" }),
    });
    const response2 = await app.request(emptyPasswordReq);
    assertEquals(response2.status, 400);
    assertEquals(await response2.json(), {
      message: "Username and password cannot be empty!",
    });
  });

  it("should create a user with valid username and password", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const validReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "password123" }),
    });

    const response = await app.request(validReq);
    assertEquals(response.status, 201);
    assertEquals(await response.json(), {
      message: "User created successfully",
    });
  });

  it("should return 409 if user already exists", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    // First sign-up
    const firstReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "password123" }),
    });
    let response = await app.request(firstReq);
    assertEquals(response.status, 201);
    assertEquals(await response.json(), {
      message: "User created successfully",
    });

    // Second sign-up with the same username
    const secondReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "password123" }),
    });
    response = await app.request(secondReq);
    assertEquals(response.status, 409);
    assertEquals(await response.json(), {
      message: "User already exists",
    });
  });

  it("should return 400 if username or password is whitespace", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const whitespaceUsernameReq = new Request("http://localhost/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "   ", password: "password123" }),
    });

    const response1 = await app.request(whitespaceUsernameReq);
    assertEquals(response1.status, 400);
    assertEquals(await response1.json(), {
      message: "Username and password cannot be empty!",
    });
  });
});

describe("login", () => {
  it("should throw an error if username or password is missing", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const emptyBodyReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Empty body
    });

    const response1 = await app.request(emptyBodyReq);
    assertEquals(response1.status, 400);
    assertEquals(await response1.json(), {
      message: "Username and password are required",
    });

    const noUsernameReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "password123" }), // Missing username
    });
    const response2 = await app.request(noUsernameReq);
    assertEquals(response2.status, 400);
    assertEquals(await response2.json(), {
      message: "Username and password are required",
    });

    const noPasswordReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1" }), // Missing password
    });
    const response3 = await app.request(noPasswordReq);
    assertEquals(response3.status, 400);
    assertEquals(await response3.json(), {
      message: "Username and password are required",
    });
  });

  it("should return 400 if username or password is empty", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const emptyUsernameReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "", password: "password123" }),
    });
    const response1 = await app.request(emptyUsernameReq);
    assertEquals(response1.status, 400);
    assertEquals(await response1.json(), {
      message: "Username and password are required",
    });

    const emptyPasswordReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "" }),
    });
    const response2 = await app.request(emptyPasswordReq);
    assertEquals(response2.status, 400);
    assertEquals(await response2.json(), {
      message: "Username and password are required",
    });
  });

  it("should return 400 if username or password is whitespace", async () => {
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const whitespaceUsernameReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "   ", password: "password123" }),
    });

    const response1 = await app.request(whitespaceUsernameReq);
    assertEquals(response1.status, 400);
    assertEquals(await response1.json(), {
      message: "Username and password are required",
    });

    const whitespacePasswordReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "   " }),
    });
    const response2 = await app.request(whitespacePasswordReq);
    assertEquals(response2.status, 400);
    assertEquals(await response2.json(), {
      message: "Username and password are required",
    });
  });

  it("should return 409 if password is wrong", async () => {
    const verify = () => false;
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    await userManager.createUser("user1", "password123");

    const loginReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "password123" }),
    });
    const response2 = await app.request(loginReq);
    assertEquals(response2.status, 409);

    assertEquals(await response2.json(), { message: "Invalid password" });
  });

  it("should return 200 if username and password valid and create a session", async () => {
    const verify = () => false;
    const taskManager = TaskManager.init(() => 0, taskCollection);
    const todoManager = TodoManager.init(() => 0, todoCollection);
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
    const appContext: AppContext = {
      taskManager,
      todoManager,
      userManager,
      sessionManager,
      logger: silentLogger,
    };
    const app = createApp(appContext);

    const verifyPasswordStub = stub(
      userManager,
      "verifyPassword",
      () => Promise.resolve(true),
    );
    await userManager.createUser("user1", "password123");

    const loginReq = new Request("http://localhost/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "password123" }),
    });

    const response2 = await app.request(loginReq);
    assertEquals(response2.status, 201);
    assertSpyCallArgs(verifyPasswordStub, 0, [0, "password123"]);
  });
});
