import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Collection, MongoClient } from "mongodb";
import { Session, User } from "../../src/types.ts";
import { SessionManager } from "../../src/models/session-manager.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
} from "@std/assert";
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
    const session: Session = { session_id: 1, user_id: 123 };
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

describe("hasSession", () => {
  it("should return false if no session is found for the user", async () => {
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );
    const hasSession1 = await sessionManager.hasSession(999);

    assertEquals(hasSession1, false);

    const hasSession2 = await sessionManager.hasSession(1);
    assertEquals(hasSession2, false);
  });

  it("should return true if a session exists for the user", async () => {
    const session1: Session = { session_id: 0, user_id: 123 };
    const session2: Session = { session_id: 1, user_id: 456 };
    await sessionCollection.insertOne(session1);
    await sessionCollection.insertOne(session2);

    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );
    const hasSession1 = await sessionManager.hasSession(0);

    assertEquals(hasSession1, true);

    const hasSession2 = await sessionManager.hasSession(1);
    assertEquals(hasSession2, true);
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

    assertSpyCallArgs(findOneStub, 0, [{ user_id: 999 }]);
    assertEquals(error1.message, "User not found!");

    const error2 = await assertRejects(async () => {
      await sessionManager.createSession(99);
    }, Error);

    assertSpyCallArgs(findOneStub, 1, [{ user_id: 99 }]);
    assertEquals(error2.message, "User not found!");
  });

  it("should create a session for an existing user", async () => {
    const userId = 0;
    const user: User = {
      user_id: 0,
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
    assertObjectMatch(foundSession!, { session_id: 0, user_id: userId });
  });

  it("should use the idGenerator to create a session ID", async () => {
    const userId = 0;
    const user: User = {
      user_id: userId,
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

    assertObjectMatch(foundSession!, { session_id: 0, user_id: userId });

    const sessionId2 = await sessionManager.createSession(userId);
    assertEquals(sessionId2, 1);
    const foundSession2 = await sessionManager.getSessionById(1);
    assertObjectMatch(foundSession2!, { session_id: 1, user_id: userId });
  });

  it("should create session for any user ID", async () => {
    const userId1 = 0;
    const user1: User = {
      user_id: userId1,
      username: "User One",
      password: "password1",
    };
    await userCollection.insertOne(user1);
    const userId2 = 1;
    const user2: User = {
      user_id: userId2,
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
    assertObjectMatch(foundSession1!, { session_id: 0, user_id: userId1 });

    const sessionId2 = await sessionManager.createSession(userId2);
    assertEquals(sessionId2, 1);
    const foundSession2 = await sessionManager.getSessionById(1);
    assertObjectMatch(foundSession2!, { session_id: 1, user_id: userId2 });
  });

  it("should create multiple sessions for the same user", async () => {
    const userId = 0;
    const user: User = {
      user_id: userId,
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
    assertObjectMatch(foundSession1!, { session_id: 0, user_id: userId });

    const sessionId2 = await sessionManager.createSession(userId);
    assertEquals(sessionId2, 1);
    const foundSession2 = await sessionManager.getSessionById(1);
    assertObjectMatch(foundSession2!, { session_id: 1, user_id: userId });
  });
});

describe("deleteSession", () => {
  it("should throw an error if session does not exist", async () => {
    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );

    const hasSessionStub = stub(
      sessionManager,
      "hasSession",
      () => Promise.resolve(false),
    );

    const error1 = await assertRejects(async () => {
      await sessionManager.deleteSession(999);
    }, Error);

    assertSpyCallArgs(hasSessionStub, 0, [999]);
    assertEquals(error1.message, "Session not found!");

    const error2 = await assertRejects(async () => {
      await sessionManager.deleteSession(1);
    }, Error);
    assertSpyCallArgs(hasSessionStub, 1, [1]);
    assertEquals(error2.message, "Session not found!");
  });

  it("should delete an existing session", async () => {
    const session1: Session = { session_id: 0, user_id: 123 };
    const session2: Session = { session_id: 1, user_id: 456 };
    await sessionCollection.insertOne(session1);
    await sessionCollection.insertOne(session2);

    const sessionManager = SessionManager.init(
      () => 0,
      sessionCollection,
      userCollection,
    );

    const hasSessionStub = stub(
      sessionManager,
      "hasSession",
      () => Promise.resolve(true),
    );

    await sessionManager.deleteSession(0);
    assertSpyCallArgs(hasSessionStub, 0, [0]);

    const foundSession = await sessionManager.getSessionById(0);
    assertEquals(foundSession, null);

    await sessionManager.deleteSession(1);
    assertSpyCallArgs(hasSessionStub, 1, [1]);

    const foundSession2 = await sessionManager.getSessionById(1);
    assertEquals(foundSession2, null);
  });
});
