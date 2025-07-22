import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Collection, MongoClient } from "mongodb";
import { User } from "../../src/types.ts";
import { UserManager } from "../../src/models/user-manager.ts";
import { assert } from "node:console";
import { assertEquals } from "@std/assert/equals";
import { assertRejects } from "@std/assert";

let client: MongoClient;
let userCollection: Collection<User>;

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
    const encrypt = (password: string) => password;
    const userManager: UserManager = UserManager.init(
      () => 0,
      encrypt,
      userCollection,
    );

    assert(userManager instanceof UserManager);
  });
});

describe("getUserById", () => {
  it("should return null when user is not present", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );
    const foundUser = await userManager.getUserById(0);
    assertEquals(foundUser, null);
  });

  it("should return the user when present", async () => {
    const user: User = { _id: 1, username: "Test User", password: "test123" };
    await userCollection.insertOne(user);

    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );
    const foundUser = await userManager.getUserById(1);
    assertEquals(foundUser, user);
  });
});

describe("addUser", () => {
  it("should throw an error when username is empty", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("", "test123");
    }, Error);

    assertEquals(error.message, "Username cannot be empty!");
  });

  it("should throw an error when password is empty", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("testUser", "");
    }, Error);

    assertEquals(error.message, "Password cannot be empty!");
  });

  it("should throw an error if username is just whitespace", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("   ", "test123");
    }, Error);

    assertEquals(error.message, "Username cannot be empty!");
  });

  it("should throw an error if password is just whitespace", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("testUser", "   ");
    }, Error);

    assertEquals(error.message, "Password cannot be empty!");
  });

  it("should throw an error if username contains space", async () => {
    const userManager: UserManager = UserManager.init(
      () => 1,
      (password: string) => password,
      userCollection,
    );

    const error = await assertRejects(async () => {
      await userManager.createUser("test User", "test123");
    }, Error);

    assertEquals(error.message, "Username cannot contain spaces!");
  });

  it("should create a user when valid username and password are provided", async () => {
    const user: User = { _id: 0, username: "testUser", password: "test123" };

    const userManager: UserManager = UserManager.init(
      () => 0,
      (password: string) => password,
      userCollection,
    );

    const userId = await userManager.createUser("testUser", "test123");
    assertEquals(userId, 0);

    const addedUser = await userManager.getUserById(userId);
    assertEquals(addedUser, user);
  });

  it("should use the idGenerator to generate a unique user ID", async () => {
    let id = 0;
    const idGenerator = () => id++;
    const encrypt = (password: string) => password;

    const userManager: UserManager = UserManager.init(
      idGenerator,
      encrypt,
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
    const encrypt = (password: string) => `encrypted-${password}`;
    const userManager: UserManager = UserManager.init(
      () => 0,
      encrypt,
      userCollection,
    );

    await userManager.createUser("testUser", "test123");
    const addedUser = await userManager.getUserById(0);

    assertEquals(addedUser?.password, "encrypted-test123");
  });
});
