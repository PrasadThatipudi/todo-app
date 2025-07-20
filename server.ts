import { Collection, MongoClient } from "mongodb";
import createApp from "./src/app.ts";
import { TodoManager } from "./src/models/todo-manager.ts";
import { AppContext, Task, Todo } from "./src/types.ts";
import { TaskManager } from "./src/models/task-manager.ts";

const main = () => {
  const idGenerator = (start: number) => () => start++;
  const client = new MongoClient("mongodb://localhost:27017");
  const database = client.db("todoApp");

  const todoCollection: Collection<Todo> = database.collection("todos");
  const taskCollection: Collection<Task> = database.collection("tasks");

  const appContext: AppContext = {
    todoManager: TodoManager.init(idGenerator(0), todoCollection),
    taskManager: TaskManager.init(idGenerator(0), taskCollection),
  };

  Deno.serve(createApp(appContext).fetch);
};

main();
