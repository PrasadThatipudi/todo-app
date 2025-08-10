import { Collection } from "mongodb";
import { Session, User } from "../types.ts";

class SessionManager {
  private constructor(
    private readonly idGenerator: () => number,
    private readonly sessionCollection: Collection<Session>,
    private readonly userCollection: Collection<User>
  ) {}

  static init(
    idGenerator: () => number,
    sessionCollection: Collection<Session>,
    userCollection: Collection<User>
  ): SessionManager {
    return new SessionManager(idGenerator, sessionCollection, userCollection);
  }

  async getSessionById(sessionId: number): Promise<Session | null> {
    return await this.sessionCollection.findOne({ session_id: sessionId });
  }

  async hasSession(sessionId: number): Promise<boolean> {
    return (
      (await this.sessionCollection.findOne({ session_id: sessionId })) !== null
    );
  }

  private async hasNoUser(userId: number): Promise<boolean> {
    return !(await this.userCollection.findOne({ user_id: userId }));
  }

  async createSession(userId: number): Promise<number> {
    if (await this.hasNoUser(userId)) throw new Error("User not found!");

    const sessionId = this.idGenerator();
    const session: Session = { session_id: sessionId, user_id: userId };

    await this.sessionCollection.insertOne(session);
    return sessionId;
  }

  async deleteSession(sessionId: number): Promise<boolean> {
    if (!(await this.hasSession(sessionId)))
      throw new Error("Session not found!");

    return (await this.sessionCollection.deleteOne({ session_id: sessionId }))
      .acknowledged;
  }
}

export { SessionManager };
