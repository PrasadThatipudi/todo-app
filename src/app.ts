import { Context, Hono, MiddlewareHandler, Next } from "hono";
import { AppContext, AppVariables } from "./types.ts";
import { handleAddTodo, serveTodos } from "./handlers/todo-handlers.ts";
import { handleAddTask, handleToggleTask } from "./handlers/task-handlers.ts";

const setupAppContext =
  (appContext: AppContext): MiddlewareHandler =>
  async (ctx: Context, next: Next) => {
    ctx.set("todoManager", appContext.todoManager);

    return await next();
  };

const createApp = (appContext: AppContext) => {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use(setupAppContext(appContext));

  app.get("/todos", serveTodos);

  app.post("/todos", handleAddTodo);
  app.post("/todos/:todoId/tasks", handleAddTask);

  app.patch("/todos/:todoId/tasks/:taskId", handleToggleTask);

  return app;
};

export default createApp;
