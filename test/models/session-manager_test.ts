import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Collection, MongoClient } from "mongodb";
import { Session, User } from "../../src/types.ts";
import { SessionManager } from "../../src/models/session-manager.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

let client: MongoClient;
let sessionCollection: Collection<Session>;
let userCollection: Collection<User>;

beforeEach(async () => {
  client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  sessionCollection = client.db("test").collection("sessions");
  userCollection = client.db("test").collection("users");
  await sessionCollection.deleteMany({});
  await userCollection.deleteMany({});
});

afterEach(async () => {
  await sessionCollection.drop();
  await userCollection.drop();
  await client.close();
});

describe("init", () => {
  it("should initialize the session manager with sessionCollection, userCollection & idGenerator", () => {
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );

    assert(sessionManager instanceof SessionManager);
  });
});

describe("getSessionById", () => {
  it("should return null if no session is found", async () => {
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );
    const foundSession = await sessionManager.getSessionById(999);

    assert(foundSession === null);
  });

  it("should return a session by its ID", async () => {
    const session: Session = { _id: 1, user_id: 123 };
    await sessionCollection.insertOne(session);

    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );
    const foundSession = await sessionManager.getSessionById(1);

    assert(foundSession);
    assertEquals(foundSession, session);
  });
});

describe("createSession", () => {
  it("should throw an error if user does not exist", async () => {
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );

    const findOneStub = stub(
      userCollection,
      "findOne",
      () => Promise.resolve(null),
    );

    const error1 = await assertRejects(async () => {
      await sessionManager.createSession(999);
    }, Error);

    assertSpyCallArgs(findOneStub, 0, [{ _id: 999 }]);
    assertEquals(error1.message, "User not found!");

    const error2 = await assertRejects(async () => {
      await sessionManager.createSession(99);
    }, Error);

    assertSpyCallArgs(findOneStub, 1, [{ _id: 99 }]);
    assertEquals(error2.message, "User not found!");
  });

  it("should create a session for an existing user", async () => {
    const userId = 0;
    const user: User = {
      _id: 0,
      username: "Test User",
      password: "password",
    };
    await userCollection.insertOne(user);

    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );

    const sessionId = await sessionManager.createSession(userId);

    assertEquals(sessionId, 0);
    const foundSession = await sessionManager.getSessionById(0);

    assertEquals(foundSession, { _id: 0, user_id: userId });
  });

  it("should use the idGenerator to create a session ID", async () => {
    const userId = 0;
    const user: User = {
      _id: userId,
      username: "Test User",
      password: "password",
    };
    await userCollection.insertOne(user);

    let id = 0;
    const idGenerator = () => id++;
    const sessionManager = SessionManager.init(
      idGenerator,
      sessionCollection,
      userCollection,
    );

    const sessionId1 = await sessionManager.createSession(userId);

    assertEquals(sessionId1, 0);
    const foundSession = await sessionManager.getSessionById(0);

    assertEquals(foundSession, { _id: 0, user_id: userId });

    const sessionId2 = await sessionManager.createSession(userId);
    assertEquals(sessionId2, 1);
    const foundSession2 = await sessionManager.getSessionById(1);
    assertEquals(foundSession2, { _id: 1, user_id: userId });
  });

  it("should create session for any user ID", async () => {
    const userId1 = 0;
    const user1: User = {
      _id: userId1,
      username: "User One",
      password: "password1",
    };
    await userCollection.insertOne(user1);
    const userId2 = 1;
    const user2: User = {
      _id: userId2,
      username: "User Two",
      password: "password2",
    };
    await userCollection.insertOne(user2);

    let id = 0;
    const idGenerator = () => id++;
    const sessionManager = SessionManager.init(
      idGenerator,
      sessionCollection,
      userCollection,
    );
    const sessionId1 = await sessionManager.createSession(userId1);
    assertEquals(sessionId1, 0);
    const foundSession1 = await sessionManager.getSessionById(0);
    assertEquals(foundSession1, { _id: 0, user_id: userId1 });

    const sessionId2 = await sessionManager.createSession(userId2);
    assertEquals(sessionId2, 1);
    const foundSession2 = await sessionManager.getSessionById(1);
    assertEquals(foundSession2, { _id: 1, user_id: userId2 });
  });

  it("should create multiple sessions for the same user", async () => {
    const userId = 0;
    const user: User = {
      _id: userId,
      username: "Test User",
      password: "password",
    };
    await userCollection.insertOne(user);

    let id = 0;
    const idGenerator = () => id++;
    const sessionManager = SessionManager.init(
      idGenerator,
      sessionCollection,
      userCollection,
    );

    const sessionId1 = await sessionManager.createSession(userId);
    assertEquals(sessionId1, 0);
    const foundSession1 = await sessionManager.getSessionById(0);
    assertEquals(foundSession1, { _id: 0, user_id: userId });

    const sessionId2 = await sessionManager.createSession(userId);
    assertEquals(sessionId2, 1);
    const foundSession2 = await sessionManager.getSessionById(1);
    assertEquals(foundSession2, { _id: 1, user_id: userId });
  });
});
