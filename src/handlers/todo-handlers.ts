import { Context } from "hono";
import { AppVariables, Todo, TodoJSON } from "../types.ts";

const serveTodos = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const taskManager = ctx.get("taskManager");
  const userId = Number(ctx.get("userId")!);

  const todos = await todoManager.getAllTodos(userId);
  const userTodosJSON: TodoJSON[] = await Promise.all(
    todos.map(async (todo: Todo): Promise<TodoJSON> => {
      const { title, todo_id: todo_id, user_id } = todo;
      return {
        title,
        user_id,
        todo_id,
        tasks: await taskManager.getAllTasks(userId, todo_id),
      };
    })
  );

  return ctx.json(userTodosJSON);
};

const handleAddTodo = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const taskManager = ctx.get("taskManager");
  const userId = Number(ctx.get("userId")!);
  const body = await ctx.req.json();

  if (body.title === undefined) {
    return ctx.json({ message: "Title is required" }, 400);
  }

  if (typeof body.title !== "string") {
    return ctx.json({ message: "Title must be a string." }, 400);
  }

  if (body.title.trim() === "") {
    return ctx.json({ message: "Title should not be empty." }, 400);
  }

  const addedTodoId = await todoManager.addTodo(userId, body.title);
  const todo = (await todoManager.getTodoById(userId, addedTodoId))!;

  const { title, user_id, todo_id: todo_id } = todo;
  const tasks = await taskManager.getAllTasks(userId, todo_id);
  const todoJSON: TodoJSON = { user_id, title, todo_id, tasks };

  return ctx.json(todoJSON, 201);
};

const handleRemoveTodo = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const todoId = Number(ctx.req.param("todoId"));
  const userId = Number(ctx.get("userId")!);

  try {
    await todoManager.removeTodo(userId, todoId);
    return ctx.json({ message: "Todo removed successfully" }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "Todo not found") {
      return ctx.json({ message: "Todo not found" }, 404);
    }
  }
};

export { handleAddTodo, serveTodos, handleRemoveTodo };
