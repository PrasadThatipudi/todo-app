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

  it("should able to add multiple todos", async () => {
    const appContext = {
      todoManager: TodoManager.init(
        () => 0,
        () => () => 0,
      ),
    };

    const todo1 = Todo.init(0, "First Todo", () => 0);
    const todo2 = Todo.init(1, "Second Todo", () => 0);

    const todoManagerAdd = stub(appContext.todoManager, "addTodo", (title) => {
      return title === "First Todo" ? 0 : 1;
    });
    const todoManagerGet = stub(
      appContext.todoManager,
      "getTodoById",
      (id) => id === 0 ? todo1 : todo2,
    );
    const todoJsonStub1 = stub(todo1, "json", () => ({
      todo_Id: 0,
      title: "First Todo",
      tasks: [],
    }));
    const todoJsonStub2 = stub(todo2, "json", () => ({
      todo_Id: 1,
      title: "Second Todo",
      tasks: [],
    }));

    const app = createApp(appContext);

    // Add first todo
    let response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "First Todo" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 201);
    assertSpyCallArgs(todoManagerAdd, 0, ["First Todo"]);
    let todoJson = await response.json();
    assertEquals(todoJson, { todo_Id: 0, title: "First Todo", tasks: [] });
    assertSpyCallArgs(todoManagerGet, 0, [0]);
    assertSpyCallArgs(todoJsonStub1, 0, []);

    // Add second todo
    response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "Second Todo" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 201);
    assertSpyCallArgs(todoManagerAdd, 1, ["Second Todo"]);
    todoJson = await response.json();
    assertEquals(todoJson, { todo_Id: 1, title: "Second Todo", tasks: [] });
    assertSpyCallArgs(todoManagerGet, 1, [1]);
    assertSpyCallArgs(todoJsonStub2, 0, []);
  });

  it("should return 400 if title is missing", async () => {
    const appContext = {
      todoManager: TodoManager.init(
        () => 0,
        () => () => 0,
      ),
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title is required and must be a string.");
  });

  it("should return 400 if title is empty string", async () => {
    const appContext = {
      todoManager: TodoManager.init(
        () => 0,
        () => () => 0,
      ),
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title is required and must be a string.");
  });

  it("should return 400 if title is empty after trim", async () => {
    const appContext = {
      todoManager: TodoManager.init(
        () => 0,
        () => () => 0,
      ),
    };

    const app = createApp(appContext);
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "   " }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 400);
    const errorJson = await response.json();
    assertEquals(errorJson.message, "Title is required and must be a string.");
  });
});
