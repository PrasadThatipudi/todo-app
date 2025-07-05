import { describe, it } from "@std/testing/bdd";
import { TaskManager } from "../../src/models/task-manager.ts";
import { assertEquals } from "@std/assert";

describe("getAllTasks", () => {
  it("should return empty array initially", () => {
    const taskManager = new TaskManager(() => 0);
    const tasks = taskManager.getAllTasks();

    assertEquals(tasks, []);
  });

  it("should return all added tasks", () => {
    const taskManager = new TaskManager(() => 0);

    taskManager.addTask("test-task-1");
    taskManager.addTask("test-task-2");

    const tasks = taskManager.getAllTasks();

    assertEquals(tasks.length, 2);
  });
});

describe("addTask", () => {
  it("should add a task", () => {
    const taskManager = new TaskManager(() => 0);
    const task = { task_Id: 0, description: "test-task-1", done: false };
    const addedTask = taskManager.addTask("test-task-1");

    assertEquals(addedTask.json(), task);
    assertEquals(taskManager.getAllTasks().length, 1);
  });

  it("should add a task with different id", () => {
    const taskManager = new TaskManager(() => 1);
    const task = { task_Id: 1, description: "test-task-1", done: false };
    const addedTask = taskManager.addTask("test-task-1");

    assertEquals(addedTask.json(), task);
    assertEquals(taskManager.getAllTasks().length, 1);
  });
});

describe("getTaskById", () => {
  it("should return null for non-existing task", () => {
    const taskManager = new TaskManager(() => 0);
    const task = taskManager.getTaskById(1);

    assertEquals(task, null);
  });

  it("should return the added task", () => {
    const taskManager = new TaskManager(() => 0);
    const task = taskManager.addTask("test-task-1");

    assertEquals(taskManager.getTaskById(0), task);
  });
});
