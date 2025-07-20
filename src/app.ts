import { Context, Hono, MiddlewareHandler, Next } from "hono";
import { AppContext, AppVariables } from "./types.ts";
import { handleAddTodo, serveTodos } from "./handlers/todo-handlers.ts";
import {
  handleAddTask,
  handleDeleteTask,
  handleToggleTask,
} from "./handlers/task-handlers.ts";

const setupAppContext =
  (appContext: AppContext): MiddlewareHandler =>
  async (ctx: Context, next: Next) => {
    ctx.set("todoManager", appContext.todoManager);
    ctx.set("taskManager", appContext.taskManager);
    ctx.set("userId", 0);

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

  if (!(await taskManager.hasTask(0, 0, 0))) {
    return ctx.json({ message: "Task is not exist!" }, 404);
  }

  return await next();
};

const createApp = (appContext: AppContext) => {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use(setupAppContext(appContext));

  app.get("/todos", serveTodos);

  app.post("/todos", handleAddTodo);
  app.use("/todos/:todoId/tasks", checkTodoExistence);
  app.post("/todos/:todoId/tasks", handleAddTask);

  app.use("/todos/:todoId/tasks/:taskId", checkTodoExistence);
  app.use("/todos/:todoId/tasks/:taskId", checkTaskExistence);
  app.patch("/todos/:todoId/tasks/:taskId", handleToggleTask);

  app.use("/todos/:todoId/tasks/:taskId", checkTodoExistence);
  app.use("/todos/:todoId/tasks/:taskId", checkTaskExistence);
  app.delete("/todos/:todoId/tasks/:taskId", handleDeleteTask);

  return app;
};

export default createApp;
