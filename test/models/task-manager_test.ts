import { describe, it } from "@std/testing/bdd";
import { TaskManager } from "../../src/models/task-manager.ts";
import { assert, assertEquals, assertFalse } from "@std/assert";

describe("getAllTasks", () => {
  it("should return empty array initially", () => {
    const taskManager = new TaskManager(() => 0);
    const tasks = taskManager.getAllTasks();

    assertEquals(tasks, []);
  });

  it("should return all added tasks", () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = new TaskManager(idGenerator(0));

    const task1Id = taskManager.addTask("test-task-1")!;
    const task2Id = taskManager.addTask("test-task-2")!;

    const task1 = taskManager.getTaskById(task1Id);
    const task2 = taskManager.getTaskById(task2Id);

    const tasks = taskManager.getAllTasks();

    assertEquals(tasks.length, 2);
    assertEquals(tasks, [task1, task2]);
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
    const taskId = taskManager.addTask("test-task-1");
    const task = taskManager.getTaskById(taskId!);

    assertEquals(taskManager.getTaskById(0), task);
  });
});

describe("hasTask", () => {
  it("should return false if the task is new", () => {
    const taskManager = new TaskManager(() => 0);

    assertFalse(taskManager.hasTask(0));
  });

  it("should return true if the task is existed", () => {
    const taskManager = new TaskManager(() => 0);

    const taskId = taskManager.addTask("Test Task")!;

    assert(taskManager.hasTask(taskId));
  });

  it("should return false if the description is new", () => {
    const taskManager = new TaskManager(() => 0);

    assertFalse(taskManager.hasTask("Unknown Task"));
  });

  it("should return true if the description is existed", () => {
    const taskManager = new TaskManager(() => 0);

    taskManager.addTask("Test Task");

    assert(taskManager.hasTask("Test Task"));
  });
});

describe("addTask", () => {
  it("should add a task", () => {
    const taskManager = new TaskManager(() => 0);
    const task = { task_id: 0, description: "test-task-1", done: false };
    const taskId = taskManager.addTask("test-task-1")!;
    const addedTask = taskManager.getTaskById(taskId);

    assertEquals(addedTask!.json(), task);
    assertEquals(taskManager.getAllTasks().length, 1);
  });

  it("should add trimmed task description", () => {
    const taskManager = new TaskManager(() => 0);
    const task = { task_id: 0, description: "test-task-1", done: false };
    const taskId = taskManager.addTask("  test-task-1  ")!;
    const addedTask = taskManager.getTaskById(taskId);

    assertEquals(addedTask!.json(), task);
    assertEquals(taskManager.getAllTasks().length, 1);
  });

  it("should use idGenerator to give id to task", () => {
    const taskManager1 = new TaskManager(() => 1);
    const taskManager2 = new TaskManager(() => 2);

    const task1 = { task_id: 1, description: "test-task-1", done: false };
    const task2 = { task_id: 2, description: "test-task-2", done: false };
    const task1Id = taskManager1.addTask("test-task-1")!;
    const addedTask1 = taskManager1.getTaskById(task1Id);
    const task2Id = taskManager2.addTask("test-task-2")!;
    const addedTask2 = taskManager2.getTaskById(task2Id);

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

describe("toggleTaskDone", () => {
  it("should toggle task done state", () => {
    const taskManager = new TaskManager(() => 0);
    const taskId = taskManager.addTask("test-task-1")!;
    const task = taskManager.getTaskById(taskId);

    assertEquals(task!.done, false);

    taskManager.toggleTaskDone(taskId);
    assertEquals(taskManager.getTaskById(taskId)!.done, true);

    taskManager.toggleTaskDone(taskId);
    assertEquals(taskManager.getTaskById(taskId)!.done, false);
  });

  it("should return false if task does not exist", () => {
    const taskManager = new TaskManager(() => 0);
    const result = taskManager.toggleTaskDone(1);

    assertEquals(result, false);
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
    const taskId = taskManager.addTask("test-task-1")!;
    const task = taskManager.getTaskById(taskId);
    const removedTask = taskManager.removeTask(0);

    assertEquals(removedTask, task);
    assertEquals(taskManager.getAllTasks().length, 0);
  });
});

describe("json", () => {
  it("should return an empty array when no tasks are present", () => {
    const taskManager = new TaskManager(() => 0);
    const tasks = taskManager.json();

    assertEquals(tasks, []);
  });

  it("should return all tasks in json format", () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = new TaskManager(idGenerator(0));

    taskManager.addTask("Test Task 1");
    taskManager.addTask("Test Task 2");

    const tasks = taskManager.json();
    assertEquals(tasks.length, 2);
    assertEquals(tasks, [
      { task_id: 0, description: "Test Task 1", done: false },
      { task_id: 1, description: "Test Task 2", done: false },
    ]);
  });
});
