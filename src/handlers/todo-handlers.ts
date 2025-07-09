import { Context } from "hono";

const serveTodos = (c: Context) => {
  const todoManager = c.get("todoManager");

  return c.json(todoManager.json());
};

export { serveTodos };
