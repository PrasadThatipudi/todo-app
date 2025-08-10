import { Context } from "hono";
import { AppVariables } from "../types.ts";

const handleAddTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const userId = Number(ctx.get("userId")!);
  const todoId = Number(ctx.req.param("todoId"));

  const { description, priority } = await ctx.req.json();
  try {
    const taskId = await taskManager.addTask(
      userId,
      todoId,
      description,
      priority
    );

    return ctx.json(
      await taskManager.getTaskById(userId, todoId, taskId!),
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ message: error.message }, 400);
    }
  }
};

const handleToggleTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const userId = Number(ctx.get("userId"));
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  await taskManager.toggleTaskDone(userId, todoId, taskId);
  const task = await taskManager.getTaskById(userId, todoId, taskId);

  return ctx.json(task, 200);
};

const handleDeleteTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const userId = Number(ctx.get("userId"));
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  return ctx.json(await taskManager.removeTask(userId, todoId, taskId), 200);
};

export { handleAddTask, handleDeleteTask, handleToggleTask };
