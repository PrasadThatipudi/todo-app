import createApp from "./src/app.ts";
import { TodoManager } from "./src/models/todo-manager.ts";

const idGenerator = (start: number) => () => start++;
const todoIdGenerator = idGenerator(0);
const taskIdGenerator = idGenerator;

const main = () => {
  const appContext = {
    todoManager: TodoManager.init(todoIdGenerator, taskIdGenerator),
  };

  Deno.serve(createApp(appContext).fetch);
};

main();
