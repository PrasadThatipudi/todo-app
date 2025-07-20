import { Context } from "hono";
import { AppVariables } from "../types.ts";

const handleAddTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const body = await ctx.req.json();
  const description = body.description;
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = await taskManager.addTask(0, todoId, description);

  return ctx.json(await taskManager.getTaskById(0, todoId, taskId!), 201);
};

const handleToggleTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  await taskManager.toggleTaskDone(0, todoId, taskId);
  const task = await taskManager.getTaskById(0, todoId, taskId);

  return ctx.json(task, 200);
};

const handleDeleteTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const taskManager = ctx.get("taskManager");
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  return ctx.json(await taskManager.removeTask(0, todoId, taskId), 200);
};

export { handleAddTask, handleDeleteTask, handleToggleTask };
