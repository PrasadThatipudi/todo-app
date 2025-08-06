import { Context, Hono, MiddlewareHandler, Next } from "hono";
import { logger } from "hono/logger";
import { AppContext, AppVariables } from "./types.ts";
import { handleAddTodo, serveTodos } from "./handlers/todo-handlers.ts";
import {
  handleAddTask,
  handleDeleteTask,
  handleToggleTask,
} from "./handlers/task-handlers.ts";
import {
  handleLogin,
  handleSignUp,
} from "./handlers/authentication-handlers.ts";
import { getCookie } from "hono/cookie";
import { cors } from "hono/cors";

const setupAppContext =
  (appContext: AppContext): MiddlewareHandler =>
  async (ctx: Context, next: Next) => {
    const { todoManager, taskManager, userManager, sessionManager } =
      appContext;
    ctx.set("todoManager", todoManager);
    ctx.set("taskManager", taskManager);
    ctx.set("userManager", userManager);
    ctx.set("sessionManager", sessionManager);

    return await next();
  };

const checkTodoExistence: MiddlewareHandler = async (
  ctx: Context<{ Variables: AppVariables }>,
  next: Next,
) => {
  const todoManager = ctx.get("todoManager");
  const todoId = Number(ctx.req.param("todoId"));

  if (!(await todoManager.hasTodo(0, todoId))) {
    return ctx.json({ message: "Todo is not exist!" }, 404);
  }

  return await next();
};

const checkTaskExistence: MiddlewareHandler = async (
  ctx: Context<{ Variables: AppVariables }>,
  next: Next,
) => {
  const taskManager = ctx.get("taskManager");
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  if (!(await taskManager.hasTask(0, todoId, taskId))) {
    return ctx.json({ message: "Task is not exist!" }, 404);
  }

  return await next();
};

const authenticateUserAndSetUserContext: MiddlewareHandler = async (
  ctx: Context<{ Variables: AppVariables }>,
  next: Next,
) => {
  const sessionId = Number(getCookie(ctx, "sessionId"));
  const sessionManager = ctx.get("sessionManager");

  if (!(await sessionManager.hasSession(sessionId))) {
    return ctx.json({ message: "Unauthorized" }, 401);
  }

  const session = (await sessionManager.getSessionById(sessionId))!;

  ctx.set("userId", session.user_id);

  return await next();
};

const createApp = (appContext: AppContext) => {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use(logger(appContext.logger));
  app.use(setupAppContext(appContext));

  app.use(
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.post("/signup", handleSignUp);
  app.post("/login", handleLogin);
  app.use(authenticateUserAndSetUserContext);
  app.get("/todos", serveTodos);

  app.post("/todos", handleAddTodo);
  app.use("/todos/:todoId/tasks", checkTodoExistence);
  app.post("/todos/:todoId/tasks", handleAddTask);

  app.use("/todos/:todoId/tasks/:taskId", checkTodoExistence);
  app.use("/todos/:todoId/tasks/:taskId", checkTaskExistence);
  app.patch("/todos/:todoId/tasks/:taskId", handleToggleTask);

  app.delete("/todos/:todoId/tasks/:taskId", handleDeleteTask);

  return app;
};

export default createApp;
