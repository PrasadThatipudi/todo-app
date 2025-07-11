import { Context } from "hono";
import { AppVariables } from "../types.ts";

const handleAddTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const todoId = Number(ctx.req.param("todoId"));
  const body = await ctx.req.json();
  const taskDescription = body.description;

  if (!todoManager.hasTodo(0)) {
    return ctx.json({ message: "Todo is not exist!" }, 404);
  }

  if (todoManager.hasTask(todoId, taskDescription)) {
    return ctx.json({ message: "Task already exists!" }, 409);
  }

  const taskId = todoManager.addTask(todoId, taskDescription);
  const taskJson = todoManager.getTaskJson(todoId, taskId)!;

  return ctx.json(taskJson, 201);
};

const handleToggleTask = (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  if (!todoManager.hasTodo(todoId)) {
    return ctx.json({ message: "Todo is not exist!" }, 404);
  }

  if (!todoManager.hasTask(todoId, taskId)) {
    return ctx.json({ message: "Task is not exist!" }, 404);
  }

  todoManager.toggleTask(todoId, taskId);
  const taskJson = todoManager.getTaskJson(todoId, taskId);

  return ctx.json(taskJson, 200);
};

export { handleAddTask, handleToggleTask };
