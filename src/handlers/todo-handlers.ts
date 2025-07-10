import { Context } from "hono";
import { AppVariables } from "../types.ts";

const serveTodos = (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");

  return ctx.json(todoManager.json());
};

const handleAddTodo = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const body = await ctx.req.json();

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return ctx.json(
      { message: "Title is required and must be a string." },
      400,
    );
  }

  const newTodoId = todoManager.addTodo(body.title);
  const newTodo = todoManager.getTodoById(newTodoId)!;

  return ctx.json(newTodo.json(), 201);
};

export { handleAddTodo, serveTodos };
