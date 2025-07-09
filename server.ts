import createApp from "./src/app.ts";
import { TodoManager } from "./src/models/todo-manager.ts";

const todoIdGenerator = (start: number = 0) => start++;
const taskIdGenerator = () => (start: number = 0) => start++;

const main = () => {
  const appContext = {
    todoManager: TodoManager.init(todoIdGenerator, taskIdGenerator),
  };

  Deno.serve(createApp(appContext).fetch);
};

main();
