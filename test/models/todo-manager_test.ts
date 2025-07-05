import { describe, it } from "@std/testing/bdd";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assert } from "@std/assert/assert";

describe("init", () => {
  it("should initialize the TodoManager", () => {
    const todoManager = TodoManager.init(() => 0);

    assert(todoManager instanceof TodoManager);
  });
});

describe("getAllTodos", () => {
  it("should return an empty array when no todos are present", () => {
    const todoManager = TodoManager.init(() => 0);
    const todos = todoManager.getAllTodos();

    assert(Array.isArray(todos));
    assert(todos.length === 0);
  });
});
