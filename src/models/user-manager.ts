import { Collection } from "mongodb";
import { User } from "../types.ts";

class UserManager {
  constructor(
    private readonly idGenerator: () => number,
    private readonly encryptPassword: (password: string) => Promise<string>,
    private readonly passwordVerifier: (
      password: string,
      hash: string,
    ) => Promise<boolean>,
    private readonly userCollection: Collection<User>,
  ) {}

  static init(
    idGenerator: () => number,
    encryptPassword: (password: string) => Promise<string>,
    passwordVerifier: (password: string, hash: string) => Promise<boolean>,
    userCollection: Collection<User>,
  ): UserManager {
    return new UserManager(
      idGenerator,
      encryptPassword,
      passwordVerifier,
      userCollection,
    );
  }

  async getUserById(userId: number): Promise<User | null> {
    return await this.userCollection.findOne({ user_id: userId });
  }

  async getIdByUsername(username: string): Promise<number | null> {
    const userId = (
      await this.userCollection.findOne(
        { username },
        { projection: { user_id: 1 } },
      )
    )?.user_id;

    return userId !== undefined ? userId : null;
  }

  async hasUser(lookUp: number | string): Promise<boolean> {
    const lookUpKey = typeof lookUp === "number" ? "user_id" : "username";

    return (
      (await this.userCollection.findOne({ [lookUpKey]: lookUp })) !== null
    );
  }

  async createUser(username: string, password: string): Promise<number> {
    if (!username.trim() || !password.trim()) {
      throw new Error("Username and password cannot be empty!");
    }

    if (username.includes(" ")) {
      throw new Error("Username cannot contain spaces!");
    }

    if (await this.hasUser(username)) {
      throw new Error("Username is already exists!", {
        cause: "DuplicateUser",
      });
    }

    const userId = this.idGenerator();
    const user: User = {
      user_id: userId,
      username,
      password: await this.encryptPassword(password),
    };

    await this.userCollection.insertOne(user);
    return userId;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    if (!(await this.hasUser(userId))) throw new Error("User not found!");

    const hashedPassword = (await this.getUserById(userId))!.password;

    return this.passwordVerifier(password, hashedPassword);
  }
}

export { UserManager };
