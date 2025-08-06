import { Context } from "hono";
import { setCookie } from "hono/cookie";
import { AppVariables } from "../types.ts";

const handleSignUp = async (ctx: Context<{ Variables: AppVariables }>) => {
  const body = await ctx.req.json();
  if (body.username === undefined || body.password === undefined) {
    return ctx.json({ message: "Username and password are required" }, 400);
  }

  const { username, password } = body;
  const userManager = ctx.get("userManager");

  try {
    await userManager.createUser(username, password);
  } catch (error) {
    if (error instanceof Error && error.cause === "DuplicateUser") {
      return ctx.json({ message: "User already exists" }, 409);
    }

    if (error instanceof Error) {
      return ctx.json({ message: error.message }, 400);
    }
  }

  return ctx.json({ message: "User created successfully" }, 201);
};

const handleLogin = async (ctx: Context<{ Variables: AppVariables }>) => {
  const body = await ctx.req.json();
  if (!body.username || !body.password) {
    return ctx.json({ message: "Username and password are required" }, 400);
  }

  const { username, password } = body;
  if (username.trim() === "" || password.trim() === "") {
    return ctx.json({ message: "Username and password are required" }, 400);
  }

  const sessionManager = ctx.get("sessionManager");
  const userManager = ctx.get("userManager");

  const userId = (await userManager.getIdByUsername(username))!;
  if (userId === null) return ctx.json({ message: "User not found" }, 404);

  if (!(await userManager.verifyPassword(userId, password))) {
    return ctx.json({ message: "Invalid password" }, 409);
  }

  const sessionId = await sessionManager.createSession(userId);
  setCookie(ctx, "sessionId", sessionId.toString());
  return ctx.json({ message: "Login successful" }, 201);
};

export { handleLogin, handleSignUp };
