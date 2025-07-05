import { describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";

const idGenerator = (start: number) => () => start++;

describe("init", () => {
  it("should initialize the TodoManager", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    assert(todoManager instanceof TodoManager);
  });
});

describe("getAllTodos", () => {
  it("should return an empty array when no todos are present", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todos = todoManager.getAllTodos();

    assert(Array.isArray(todos));
    assert(todos.length === 0);
  });
});

describe("addTodo", () => {
  it("should return -1 if title is empty string", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodo = todoManager.addTodo("");

    assertEquals(todoManager.getAllTodos().length, 0);
    assertEquals(addedTodo, -1);
  });

  it("should return -1 if title is empty string after trim", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodo = todoManager.addTodo("");

    assertEquals(todoManager.getAllTodos().length, 0);
    assertEquals(addedTodo, -1);
  });

  it("should return added todo when title is valid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodoId = todoManager.addTodo("Test Todo");

    const allTodos = todoManager.getAllTodos();
    assertEquals(allTodos.length, 1);
    assertEquals(addedTodoId, 0);
  });

  it("should able to add multiple todos", () => {
    const todoManager = TodoManager.init(idGenerator(0), idGenerator);
    const addedTodoId1 = todoManager.addTodo("Test Todo 1");
    const addedTodoId2 = todoManager.addTodo("Test Todo 2");

    const allTodos = todoManager.getAllTodos();
    assertEquals(allTodos.length, 2);
    assertEquals(addedTodoId1, 0);
    assertEquals(addedTodoId2, 1);
  });
});

describe("addTask", () => {
  it("should return -1 when task description is invalid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "");

    assertEquals(taskId, -1);
  });

  it("should return -1 when todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const taskId = todoManager.addTask(999, "Test Task");

    assertEquals(taskId, -1);
  });

  it("should return task id when task description is valid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");

    stub(todoManager.getTodoById(todoId)!, "addTask", () => 0);

    const taskId = todoManager.addTask(todoId, "Test Task");
    assertEquals(taskId, 0);
  });
});

describe("getTodoById", () => {
  it("should return null when todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todo = todoManager.getTodoById(999);

    assertEquals(todo, null);
  });

  it("should return the correct todo when it exists", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodoId = todoManager.addTodo("Test Todo");
    const todo = todoManager.getTodoById(addedTodoId);

    assert(todo !== null);
  });
});
