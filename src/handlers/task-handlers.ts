import { Context } from "hono";
import { AppVariables } from "../types.ts";

const handleAddTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const userId = Number(ctx.get("userId")!);
  const todoId = Number(ctx.req.param("todoId"));

  const body = await ctx.req.json();
  const description = body.description;
  const taskId = await taskManager.addTask(userId, todoId, description);

  return ctx.json(await taskManager.getTaskById(userId, todoId, taskId!), 201);
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
