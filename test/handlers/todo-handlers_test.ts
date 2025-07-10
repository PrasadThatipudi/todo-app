import { describe, it } from "@std/testing/bdd";
import createApp from "../../src/app.ts";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assertEquals } from "@std/assert/equals";
import { assertSpyCallArgs, stub } from "@std/testing/mock";
import { Todo } from "../../src/models/todo.ts";

describe("serveTodos", () => {
  it("should return all todos as json", async () => {
    const appContext = {
      todoManager: TodoManager.init(
        () => 0,
        () => () => 0,
      ),
    };

    const todoManagerJson = stub(appContext.todoManager, "json", () => []);

    const app = createApp(appContext);
    const response = await app.request("/todos");

    assertEquals(response.status, 200);
    assertSpyCallArgs(todoManagerJson, 0, []);
  });
});

describe("handleAddTodo", () => {
  it("should add a new todo and return it as json", async () => {
    const appContext = {
      todoManager: TodoManager.init(
        () => 0,
        () => () => 0,
      ),
    };

    const todo = Todo.init(0, "New Todo", () => 0);

    const todoManagerAdd = stub(appContext.todoManager, "addTodo", () => 0);
    const todoManagerGet = stub(
      appContext.todoManager,
      "getTodoById",
      () => todo,
    );
    const todoJsonStub = stub(todo, "json", () => ({
      todo_Id: 0,
      title: "New Todo",
      tasks: [],
    }));

    const app = createApp(appContext);
    const title = "New Todo";
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 201);
    assertSpyCallArgs(todoManagerAdd, 0, [title]);

    const todoJson = await response.json();
    assertEquals(todoJson, { todo_Id: 0, title, tasks: [] });
    assertSpyCallArgs(todoManagerGet, 0, [0]);
    assertSpyCallArgs(todoJsonStub, 0, []);
  });
});
