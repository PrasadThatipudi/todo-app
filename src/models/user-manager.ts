import { Collection } from "mongodb";
import { User } from "../types.ts";

class UserManager {
  constructor(
    private readonly idGenerator: () => number,
    private readonly encryptPassword: (password: string) => string,
    private readonly userCollection: Collection<User>,
  ) {}

  static init(
    idGenerator: () => number,
    encryptPassword: (password: string) => string,
    userCollection: Collection<User>,
  ): UserManager {
    return new UserManager(idGenerator, encryptPassword, userCollection);
  }

  async getUserById(userId: number): Promise<User | null> {
    return await this.userCollection.findOne({ _id: userId });
  }

  async createUser(username: string, password: string): Promise<number> {
    if (!username.trim()) throw new Error("Username cannot be empty!");
    if (username.includes(" ")) {
      throw new Error("Username cannot contain spaces!");
    }
    if (!password.trim()) throw new Error("Password cannot be empty!");

    const user: User = {
      _id: this.idGenerator(),
      username,
      password: this.encryptPassword(password),
    };

    return (await this.userCollection.insertOne(user)).insertedId;
  }
}

export { UserManager };
