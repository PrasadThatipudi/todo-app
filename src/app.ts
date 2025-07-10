import { Context, Hono, MiddlewareHandler, Next } from "hono";
import { AppContext, AppVariables } from "./types.ts";
import { handleAddTodo, serveTodos } from "./handlers/todo-handlers.ts";

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

  return app;
};

export default createApp;
