import { Context } from "hono";
import { AppVariables } from "../types.ts";
import { MongoServerError } from "mongodb";

const handleSignUp = async (ctx: Context<{ Variables: AppVariables }>) => {
  const body = await ctx.req.json();
  if (!body.username || !body.password) {
    return ctx.json({ message: "Username and password are required" }, 400);
  }

  const { username, password } = body;
  const userManager = ctx.get("userManager");

  try {
    await userManager.createUser(username, password);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return ctx.json({ message: "User already exists" }, 409);
    }

    if (error instanceof Error) {
      return ctx.json({ message: error.message }, 400);
    }
  }

  return ctx.json({ message: "User created successfully" }, 201);
};

export { handleSignUp };
