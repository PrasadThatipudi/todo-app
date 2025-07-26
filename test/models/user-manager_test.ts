import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Collection, MongoClient } from "mongodb";
import { User } from "../../src/types.ts";
import { UserManager } from "../../src/models/user-manager.ts";
import { assert } from "node:console";
import { assertEquals } from "@std/assert/equals";
import { assertObjectMatch, assertRejects } from "@std/assert";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

let client: MongoClient;
let userCollection: Collection<User>;

const testEncrypt = (password: string): Promise<string> =>
  Promise.resolve(password);
const verify = (_hash: string, _password: string): Promise<boolean> =>
  Promise.resolve(false);

const idGenerator = (start: number) => () => start++;
const createUser = (
  id: number,
  username: string,
  password: string = "test123",
): User => ({ user_id: id, username, password });

beforeEach(async () => {
  client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  userCollection = client.db("test").collection("users");
  await userCollection.deleteMany({});
});

afterEach(async () => {
  await userCollection.drop();
  await client.close();
});

describe("init", () => {
  it("should initialize the user manager with userCollection, idGenerator & encryptPassword", () => {
    const encrypt = testEncrypt;
    const userManager: UserManager = UserManager.init(
      () => 0,
      encrypt,
      verify,
      userCollection,
    );

    assert(userManager instanceof UserManager);
  });
});

describe("getUserById", () => {
  it("should return null when user is not present", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );
    const foundUser = await userManager.getUserById(0);
    assertEquals(foundUser, null);
  });

  it("should return the user when present", async () => {
    const user: User = {
      user_id: 1,
      username: "Test User",
      password: "test123",
    };
    await userCollection.insertOne(user);

    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );
    const foundUser = await userManager.getUserById(1);
    assertEquals(foundUser, user);
  });
});

describe("getIdByUsername", () => {
  it("should return null if username does not exist", async () => {
    const userManager: UserManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection,
    );
    const userId = await userManager.getIdByUsername("non-existing-user");
    assertEquals(userId, null);
  });

  it("should return the user ID if username exists", async () => {
    const user1: User = {
      user_id: 0,
      username: "TestUser",
      password: "test123",
    };
    await userCollection.insertOne(user1);
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );
    const user1Id = await userManager.getIdByUsername("TestUser");
    assertEquals(user1Id, 0);

    const user2: User = {
      user_id: 1,
      username: "AnotherUser",
      password: "test456",
    };
    await userCollection.insertOne(user2);
    const user2Id = await userManager.getIdByUsername("AnotherUser");
    assertEquals(user2Id, 1);
  });
});

describe("hasUser", () => {
  it("should return false if the userId is not exists", async () => {
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection,
    );

    assertEquals(await userManager.hasUser(999), false);
    assertEquals(await userManager.hasUser(99), false);
  });

  it("should return true if the userId is exists", async () => {
    let id = 0;
    const userManager = UserManager.init(
      () => id++,
      testEncrypt,
      verify,
      userCollection,
    );

    const findOneStub = stub(
      userCollection,
      "findOne",
      () =>
        Promise.resolve({
          user_id: 0,
          username: "testUser",
          password: "test123",
        }),
    );
    const userId1 = 0;

    await userCollection.insertOne(createUser(userId1, "test1"));
    assertEquals(userId1, 0);
    assertEquals(await userManager.hasUser(userId1), true);
    assertSpyCallArgs(findOneStub, 0, [{ user_id: userId1 }]);

    const userId2 = 1;
    await userCollection.insertOne(createUser(userId2, "test2"));

    assertEquals(userId2, 1);
    assertEquals(await userManager.hasUser(userId2), true);
    assertSpyCallArgs(findOneStub, 1, [{ user_id: userId2 }]);
  });

  it("should return false if username is not exists", async () => {
    const userManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection,
    );

    assertEquals(await userManager.hasUser("non-existing-user"), false);
    assertEquals(await userManager.hasUser("non-existing-user2"), false);
  });

  it("should return true if username is already exists", async () => {
    const userManager = UserManager.init(
      idGenerator(0),
      testEncrypt,
      verify,
      userCollection,
    );

    const findOneStub = stub(
      userCollection,
      "findOne",
      () =>
        Promise.resolve({ _id: 0, username: "test-user", password: "test123" }),
    );

    const userId1 = 0;
    await userCollection.insertOne(createUser(0, "test-user"));
    assertEquals(userId1, 0);
    assertEquals(await userManager.hasUser("test-user"), true);
    assertSpyCallArgs(findOneStub, 0, [{ username: "test-user" }]);

    const userId2 = 1;
    await userCollection.insertOne(createUser(1, "test-user2"));
    assertEquals(userId2, 1);
    assertEquals(await userManager.hasUser("test-user2"), true);
    assertSpyCallArgs(findOneStub, 1, [{ username: "test-user2" }]);
  });
});

describe("createUser", () => {
  it("should throw an error when username is empty", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("", "test123");
    }, Error);

    assertEquals(error.message, "Username and password cannot be empty!");
  });

  it("should throw an error when password is empty", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("testUser", "");
    }, Error);

    assertEquals(error.message, "Username and password cannot be empty!");
  });

  it("should throw an error if username is just whitespace", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("   ", "test123");
    }, Error);

    assertEquals(error.message, "Username and password cannot be empty!");
  });

  it("should throw an error if password is just whitespace", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("testUser", "   ");
    }, Error);

    assertEquals(error.message, "Username and password cannot be empty!");
  });

  it("should throw an error if username contains space", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("test User", "test123");
    }, Error);

    assertEquals(error.message, "Username cannot contain spaces!");
  });

  it("should create a user when valid username and password are provided", async () => {
    const user: User = {
      user_id: 0,
      username: "testUser",
      password: "test123",
    };

    const userManager: UserManager = UserManager.init(
      () => 0,
      testEncrypt,
      verify,
      userCollection,
    );

    const userId = await userManager.createUser("testUser", "test123");
    assertEquals(userId, 0);

    const addedUser = (await userManager.getUserById(userId))!;
    assertObjectMatch(addedUser, user as unknown as Record<string, unknown>);
  });

  it("should use the idGenerator to generate a unique user ID", async () => {
    let id = 0;
    const idGenerator = () => id++;
    const encrypt = testEncrypt;

    const userManager: UserManager = UserManager.init(
      idGenerator,
      encrypt,
      verify,
      userCollection,
    );

    const userId1 = await userManager.createUser("user1", "pass1");
    assertEquals(userId1, 0);

    const userId2 = await userManager.createUser("user2", "pass2");
    assertEquals(userId2, 1);

    const addedUser1 = await userManager.getUserById(userId1);
    const addedUser2 = await userManager.getUserById(userId2);

    assertEquals(addedUser1?.username, "user1");
    assertEquals(addedUser2?.username, "user2");
  });

  it("should encrypt the password before storing it", async () => {
    const encrypt = (password: string) =>
      Promise.resolve(`encrypted-${password}`);
    const userManager: UserManager = UserManager.init(
      () => 0,
      encrypt,
      verify,
      userCollection,
    );

    await userManager.createUser("testUser", "test123");
    const addedUser = await userManager.getUserById(0);

    assertEquals(addedUser?.password, "encrypted-test123");
  });

  it("should throw an error if username is already exists", async () => {
    const userManager = UserManager.init(
      idGenerator(0),
      testEncrypt,
      verify,
      userCollection,
    );

    const userId = await userManager.createUser("test", "test123");
    assertEquals(userId, 0);

    const error = await assertRejects(async () => {
      await userManager.createUser("test", "test123");
    }, Error);

    assertEquals(error.message, "Username is already exists!");
  });
});

describe("verifyPassword", () => {
  it("should throw an error if user is not found", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      testEncrypt,
      verify,
      userCollection,
    );

    const hasUserStub = stub(
      userManager,
      "hasUser",
      () => Promise.resolve(false),
    );

    const error1 = await assertRejects(async () => {
      await userManager.verifyPassword(0, "test123");
    }, Error);

    assertEquals(error1.message, "User not found!");
    assertSpyCallArgs(hasUserStub, 0, [0]);

    const error2 = await assertRejects(async () => {
      await userManager.verifyPassword(1, "test123");
    }, Error);

    assertEquals(error2.message, "User not found!");
    assertSpyCallArgs(hasUserStub, 1, [1]);
  });

  it("should use verify function of UserManager to verify password", async () => {
    const argsOfPasswordVerifier: [string, string][] = [];

    const passwordVerifier = (hash: string, password: string) => {
      argsOfPasswordVerifier.push([hash, password]);
      return Promise.resolve(hash === password);
    };

    const userManager: UserManager = UserManager.init(
      idGenerator(0),
      testEncrypt,
      passwordVerifier,
      userCollection,
    );

    const userId1 = await userManager.createUser("test", "test123");
    assertEquals(userId1, 0);

    assertEquals(await userManager.verifyPassword(userId1, "test123"), true);
    assertEquals(argsOfPasswordVerifier[0], ["test123", "test123"]);

    // const userId2 = await userManager.createUser("test2", "test456");
    // assertEquals(userId2, 1);

    // assertEquals(await userManager.verifyPassword(userId2, "test456"), true);
    // assertEquals(argsOfPasswordVerifier[1], ["test456", "test456"]);
  });
});
