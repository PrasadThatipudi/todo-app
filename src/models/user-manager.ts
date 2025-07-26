import { Collection } from "mongodb";
import { User } from "../types.ts";

class UserManager {
  constructor(
    private readonly idGenerator: () => number,
    private readonly encryptPassword: (password: string) => Promise<string>,
    private readonly passwordVerifier: (
      hash: string,
      password: string,
    ) => Promise<boolean>,
    private readonly userCollection: Collection<User>,
  ) {}

  static init(
    idGenerator: () => number,
    encryptPassword: (password: string) => Promise<string>,
    passwordVerifier: (hash: string, password: string) => Promise<boolean>,
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
    return await this.userCollection.findOne({ _id: userId });
  }

  async getIdByUsername(username: string): Promise<number | null> {
    const userId = (
      await this.userCollection.findOne(
        { username },
        { projection: { _id: 1 } },
      )
    )?._id;

    return userId !== undefined ? userId : null;
  }

  async hasUser(lookUp: number | string): Promise<boolean> {
    const lookUpKey = typeof lookUp === "number" ? "_id" : "username";

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

    const user: User = {
      _id: this.idGenerator(),
      username,
      password: await this.encryptPassword(password),
    };

    return (await this.userCollection.insertOne(user)).insertedId;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    if (!(await this.hasUser(userId))) throw new Error("User not found!");

    const hashedPassword = (await this.getUserById(userId))!.password;

    return this.passwordVerifier(hashedPassword, password);
  }
}

export { UserManager };
