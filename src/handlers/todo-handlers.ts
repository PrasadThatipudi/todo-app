import { Context } from "hono";
import { AppVariables, Todo, TodoJSON } from "../types.ts";

const serveTodos = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const taskManager = ctx.get("taskManager");

  const todos = await todoManager.getAllTodos(0);
  const userTodosJSON: TodoJSON[] = await Promise.all(
    todos.map(async (todo: Todo): Promise<TodoJSON> => {
      const { title, _id: todo_id } = todo;
      return {
        title,
        user_id: 0,
        todo_id,
        tasks: await taskManager.getAllTasks(0, todo_id),
      };
    }),
  );

  return ctx.json(userTodosJSON);
};

const handleAddTodo = async (ctx: Context<{ Variables: AppVariables }>) => {
  const todoManager = ctx.get("todoManager");
  const taskManager = ctx.get("taskManager");
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

  const addedTodoId = await todoManager.addTodo(0, body.title);
  const todo = (await todoManager.getTodoById(0, addedTodoId))!;

  const { title, user_id, _id: todo_id } = todo;
  const tasks = await taskManager.getAllTasks(0, todo_id);
  const todoJSON: TodoJSON = { user_id, title, todo_id, tasks };

  return ctx.json(todoJSON, 201);
};

export { handleAddTodo, serveTodos };
