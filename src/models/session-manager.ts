import { Collection } from "mongodb";
import { Session, User } from "../types.ts";

class SessionManager {
  private constructor(
    private readonly idGenerator: () => number,
    private readonly sessionCollection: Collection<Session>,
    private readonly userCollection: Collection<User>,
  ) {}

  static init(
    idGenerator: () => number,
    sessionCollection: Collection<Session>,
    userCollection: Collection<User>,
  ): SessionManager {
    return new SessionManager(idGenerator, sessionCollection, userCollection);
  }

  async getSessionById(sessionId: number): Promise<Session | null> {
    return await this.sessionCollection.findOne({ _id: sessionId });
  }

  private async hasNoUser(userId: number): Promise<boolean> {
    return !(await this.userCollection.findOne({ _id: userId }));
  }

  async createSession(userId: number): Promise<number> {
    if (await this.hasNoUser(userId)) {
      throw new Error("User not found!");
    }

    const session = { _id: this.idGenerator(), user_id: userId };

    return (await this.sessionCollection.insertOne(session))
      .insertedId as number;
  }
}

export { SessionManager };
