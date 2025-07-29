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

const main = async () => {
  const idGenerator = (start: number) => () => start++;
  const client = new MongoClient(Deno.env.get("MONGO_URI") || "");
  await client.connect();
  const database = client.db(config.DB_NAME);

  const todoCollection: Collection<Todo> = database.collection(
    config.TODOS_COLLECTION,
  );
  const taskCollection: Collection<Task> = database.collection(
    config.TASKS_COLLECTION,
  );
  const userCollection: Collection<User> = database.collection(
    config.USERS_COLLECTION,
  );
  const sessionCollection: Collection<Session> = database.collection(
    config.SESSIONS_COLLECTION,
  );

  const appContext: AppContext = {
    todoManager: TodoManager.init(idGenerator(0), todoCollection),
    taskManager: TaskManager.init(idGenerator(0), taskCollection),
    userManager: UserManager.init(
      idGenerator(0),
      hash,
      compare,
      userCollection,
    ),
    sessionManager: SessionManager.init(
      idGenerator(0),
      sessionCollection,
      userCollection,
    ),
  };

  Deno.serve(createApp(appContext).fetch);
};

await main();
