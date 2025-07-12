import { describe, it } from "@std/testing/bdd";
import createApp from "../../src/app.ts";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assertEquals } from "@std/assert/equals";
import { assertSpyCallArgs, stub } from "@std/testing/mock";
import { TaskJSON } from "../../src/types.ts";
import { Task } from "../../src/models/task.ts";

const testIdGenerator = () => () => 0;

describe("handleAddTask", () => {
  it("should add a task and return task json", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const appContext = { todoManager };
    const expectedTaskJson: TaskJSON = {
      task_id: 0,
      description: "Test Task",
      done: false,
    };

    const addTaskStub = stub(todoManager, "addTask", () => 0);
    const getTaskStub = stub(
      todoManager,
      "getTaskJson",
      () => expectedTaskJson,
    );

    const app = createApp(appContext);
    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 201);
    const jsonResponse: TaskJSON = await response.json();
    assertEquals(jsonResponse, {
      task_id: 0,
      description: "Test Task",
      done: false,
    });
    assertSpyCallArgs(addTaskStub, 0, [0, "Test Task"]);
    assertSpyCallArgs(getTaskStub, 0, [0, 0]);
  });

  it("should respond with 404 if todoId is not exist", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const appContext = { todoManager };

    const app = createApp(appContext);
    const todoId = 0;

    const hasTodoStub = stub(todoManager, "hasTodo", () => false);

    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test task", todoId: 0 }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, { message: "Todo is not exist!" });

    assertSpyCallArgs(hasTodoStub, 0, [0]);
  });

  it("should allow adding task to any todo", async () => {
    const createIdGenerator = (start: number) => () => () => start++;
    const testIdGenerator = createIdGenerator(0);
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);

    const expectedTaskJson1: TaskJSON = {
      task_id: 0,
      description: "Test Task 1",
      done: false,
    };

    const expectedTaskJson2: TaskJSON = {
      task_id: 0,
      description: "Test Task 2",
      done: false,
    };

    const todoId1 = todoManager.addTodo("Test Todo 1");
    const todoId2 = todoManager.addTodo("Test Todo 2");

    const appContext = { todoManager };
    const app = createApp(appContext);

    const addTaskStub = stub(todoManager, "addTask", () => 0);
    const getTaskStub = stub(
      todoManager,
      "getTaskJson",
      (todoId: number) => todoId === 0 ? expectedTaskJson1 : expectedTaskJson2,
    );

    const response1 = await app.request(`/todos/${todoId1}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test task 1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response2 = await app.request(`/todos/${todoId2}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test task 2" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response1.status, 201);
    assertEquals(response2.status, 201);
    const jsonResponse1: TaskJSON = await response1.json();
    const jsonResponse2: TaskJSON = await response2.json();
    assertEquals(jsonResponse1, {
      task_id: 0,
      description: "Test Task 1",
      done: false,
    });
    assertEquals(jsonResponse2, {
      task_id: 0,
      description: "Test Task 2",
      done: false,
    });
    assertSpyCallArgs(addTaskStub, 0, [0, "Test task 1"]);
    assertSpyCallArgs(addTaskStub, 1, [1, "Test task 2"]);
    assertSpyCallArgs(getTaskStub, 0, [0, 0]);
    assertSpyCallArgs(getTaskStub, 1, [1, 0]);
  });

  it("should allow adding multiple tasks to a todo", async () => {
    const createIdGenerator = (start: number) => () => () => start++;
    const testIdGenerator = createIdGenerator(0);
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);

    const appContext = { todoManager };
    const app = createApp(appContext);

    const createTaskJson = (taskId: number): TaskJSON => ({
      task_id: taskId,
      description: `Test Task ${taskId + 1}`,
      done: false,
    });
    const todoId1 = todoManager.addTodo("Test Todo");
    const addTaskStub = stub(
      todoManager,
      "addTask",
      (_todoId: number, description: string) =>
        description.includes("1") ? 0 : 1,
    );
    const getTaskStub = stub(
      todoManager,
      "getTaskJson",
      (_todoId: number, taskId: number) => createTaskJson(taskId),
    );

    const response1 = await app.request(`/todos/${todoId1}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task 1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response2 = await app.request(`/todos/${todoId1}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Test Task 2" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response1.status, 201);
    assertEquals(response2.status, 201);
    const jsonResponse1: TaskJSON = await response1.json();
    const jsonResponse2: TaskJSON = await response2.json();
    assertEquals(jsonResponse1, createTaskJson(0));
    assertEquals(jsonResponse2, createTaskJson(1));
    assertSpyCallArgs(addTaskStub, 0, [todoId1, "Test Task 1"]);
    assertSpyCallArgs(addTaskStub, 1, [todoId1, "Test Task 2"]);
    assertSpyCallArgs(getTaskStub, 0, [todoId1, 0]);
    assertSpyCallArgs(getTaskStub, 1, [todoId1, 1]);
  });

  it("should respond with 409 if task description is already exist", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    todoManager.addTask(todoId, "Existed");

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ description: "Existed" }),
      headers: { "Content-Type": "application/json" },
    });

    assertEquals(response.status, 409);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, { message: "Task already exists!" });
  });
});

describe("handleToggleTask", () => {
  it("should respond with 404 if todo is not exist with the given todoId", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);

    const todoId = 0;
    const taskId = 0;

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "PATCH",
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Todo is not exist!" });
  });

  it("should respond with 404 if task is not exist with the given todoId and taskId", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const todoId = todoManager.addTodo("Test Todo");

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/0`, {
      method: "PATCH",
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Task is not exist!" });
  });

  it("should return task if task status toggled successfully", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "Test Task");

    const toggleTaskStub = stub(todoManager, "toggleTask", () => true);
    const getTaskJsonStub = stub(todoManager, "getTaskJson", () => ({
      task_id: taskId,
      description: "Test Task",
      done: true,
    }));

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "PATCH",
    });

    assertEquals(response.status, 200);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, {
      task_id: 0,
      description: "Test Task",
      done: true,
    });
    assertSpyCallArgs(toggleTaskStub, 0, [todoId, taskId]);
    assertSpyCallArgs(getTaskJsonStub, 0, [todoId, taskId]);
  });
});

describe("handleDeleteTask", () => {
  it("should respond with 404 if todo is not exist with the given todoId", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);

    const todoId = 0;
    const taskId = 0;

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "DELETE",
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Todo is not exist!" });
  });

  it("should respond with 404 if task is not exist with the given todoId and taskId", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const todoId = todoManager.addTodo("Test Todo");

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/0`, {
      method: "DELETE",
    });

    assertEquals(response.status, 404);
    const jsonResponse = await response.json();

    assertEquals(jsonResponse, { message: "Task is not exist!" });
  });

  it("should delete task and return deleted task", async () => {
    const todoManager = TodoManager.init(testIdGenerator(), testIdGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "Test Task");

    const task = new Task(taskId, "Test Task");
    const deleteTaskStub = stub(todoManager, "removeTask", () => task);

    const appContext = { todoManager };
    const app = createApp(appContext);

    const response = await app.request(`/todos/${todoId}/tasks/${taskId}`, {
      method: "DELETE",
    });

    assertEquals(response.status, 200);
    const jsonResponse = await response.json();
    assertEquals(jsonResponse, task.json());
    assertSpyCallArgs(deleteTaskStub, 0, [todoId, taskId]);
  });
});
