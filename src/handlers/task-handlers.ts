import { Context } from "hono";
import { AppVariables } from "../types.ts";

const handleAddTask = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const todoId = Number(ctx.req.param("todoId"));
  const body = await ctx.req.json();
  const taskDescription = body.description;

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

  todoManager.toggleTask(todoId, taskId);
  const taskJson = todoManager.getTaskJson(todoId, taskId);

  return ctx.json(taskJson, 200);
};

const handleDeleteTask = (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const todoId = Number(ctx.req.param("todoId"));
  const taskId = Number(ctx.req.param("taskId"));

  return ctx.json(todoManager.removeTask(todoId, taskId)!.json(), 200);
};

export { handleAddTask, handleDeleteTask, handleToggleTask };
