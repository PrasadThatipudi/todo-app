import { Collection, MongoClient } from "mongodb";
import createApp from "./src/app.ts";
import { TodoManager } from "./src/models/todo-manager.ts";
import { AppContext, Session, Task, Todo, User } from "./src/types.ts";
import { TaskManager } from "./src/models/task-manager.ts";
import { UserManager } from "./src/models/user-manager.ts";
import { hash, verify } from "@felix/argon2";
import { SessionManager } from "./src/models/session-manager.ts";

const main = () => {
  const idGenerator = (start: number) => () => start++;
  const client = new MongoClient("mongodb://localhost:27017");
  const database = client.db("todoApp");

  const todoCollection: Collection<Todo> = database.collection("todos");
  const taskCollection: Collection<Task> = database.collection("tasks");
  const userCollection: Collection<User> = database.collection("users");
  const sessionCollection: Collection<Session> = database.collection(
    "sessions",
  );

  const appContext: AppContext = {
    todoManager: TodoManager.init(idGenerator(0), todoCollection),
    taskManager: TaskManager.init(idGenerator(0), taskCollection),
    userManager: UserManager.init(idGenerator(0), hash, verify, userCollection),
    sessionManager: SessionManager.init(
      idGenerator(0),
      sessionCollection,
      userCollection,
    ),
  };

  Deno.serve(createApp(appContext).fetch);
};

main();
