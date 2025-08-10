import { Collection, MongoClient } from "mongodb";
import createApp from "./src/app.ts";
import { TodoManager } from "./src/models/todo-manager.ts";
import { AppContext, Session, Task, Todo, User } from "./src/types.ts";
import { TaskManager } from "./src/models/task-manager.ts";
import { UserManager } from "./src/models/user-manager.ts";
import { compare, hash } from "https://deno.land/x/bcrypt/mod.ts";
import { SessionManager } from "./src/models/session-manager.ts";
import * as config from "./src/config.ts";
import "https://deno.land/x/dotenv/load.ts";

const connectToMongoDB = async (uri: string) => {
  if (!uri) throw new Error("MONGO_URI environment variable is not set");

  const client = new MongoClient(uri);
  try {
    await client.connect();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
  console.log("Connected to MongoDB");
  return client;
};

const idGenerator = (): number =>
  Date.now() * 10000 + Math.floor(performance.now() * 10000);

const main = async () => {
  const client = await connectToMongoDB(Deno.env.get("MONGO_URI")!);
  const database = client.db(config.DB_NAME);

  const todoCollection: Collection<Todo> = database.collection(
    config.TODOS_COLLECTION
  );
  const taskCollection: Collection<Task> = database.collection(
    config.TASKS_COLLECTION
  );
  const userCollection: Collection<User> = database.collection(
    config.USERS_COLLECTION
  );
  const sessionCollection: Collection<Session> = database.collection(
    config.SESSIONS_COLLECTION
  );

  const appContext: AppContext = {
    todoManager: TodoManager.init(idGenerator, todoCollection),
    taskManager: TaskManager.init(idGenerator, taskCollection),
    userManager: UserManager.init(idGenerator, hash, compare, userCollection),
    sessionManager: SessionManager.init(
      idGenerator,
      sessionCollection,
      userCollection
    ),
  };

  Deno.serve(createApp(appContext).fetch);
};

await main();
