import { Context } from "hono";
import { AppVariables } from "../types.ts";

const serveTodos = (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");

  return ctx.json(todoManager.json());
};

const handleAddTodo = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const { title } = await ctx.req.json();

  const newTodoId = todoManager.addTodo(title);
  const newTodo = todoManager.getTodoById(newTodoId)!;

  return ctx.json(newTodo.json(), 201);
};

export { handleAddTodo, serveTodos };
