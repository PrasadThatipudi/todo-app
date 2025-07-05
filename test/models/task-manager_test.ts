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

    assertEquals(addedTask!.json(), task);
    assertEquals(taskManager.getAllTasks().length, 1);
  });

  it("should use idGenerator to give id to task", () => {
    const taskManager1 = new TaskManager(() => 1);
    const taskManager2 = new TaskManager(() => 2);

    const task1 = { task_Id: 1, description: "test-task-1", done: false };
    const task2 = { task_Id: 2, description: "test-task-2", done: false };
    const addedTask1 = taskManager1.addTask("test-task-1");
    const addedTask2 = taskManager2.addTask("test-task-2");

    assertEquals(addedTask1!.json(), task1);
    assertEquals(addedTask2!.json(), task2);
    assertEquals(taskManager1.getAllTasks().length, 1);
    assertEquals(taskManager2.getAllTasks().length, 1);
  });

  it("should return null if task description is empty", () => {
    const taskManager = new TaskManager(() => 0);
    const addedTask = taskManager.addTask("");

    assertEquals(addedTask, null);
    assertEquals(taskManager.getAllTasks().length, 0);
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

describe("removeTask", () => {
  it("should return null for non-existing task", () => {
    const taskManager = new TaskManager(() => 0);
    const removedTask = taskManager.removeTask(1);

    assertEquals(removedTask, null);
    assertEquals(taskManager.getAllTasks().length, 0);
  });

  it("should return the removed task", () => {
    const taskManager = new TaskManager(() => 0);
    const task = taskManager.addTask("test-task-1");
    const removedTask = taskManager.removeTask(0);

    assertEquals(removedTask, task);
    assertEquals(taskManager.getAllTasks().length, 0);
  });
});
