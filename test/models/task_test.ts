import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Task } from "../../src/models/task.ts";

describe("json", () => {
  it("should return task in json | done as false", () => {
    const task = new Task(0, "test-task");
    const expectedJSON = { task_Id: 0, description: "test-task", done: false };

    assertEquals(task.json(), expectedJSON);
  });

  it("should return task in json | done as true", () => {
    const task = new Task(0, "test-task", true);
    const expectedJSON = { task_Id: 0, description: "test-task", done: true };

    assertEquals(task.json(), expectedJSON);
  });

  it("should accept different descriptions and ids", () => {
    const task1 = new Task(0, "test-task-1");
    const task2 = new Task(1, "test-task-2");

    const JSON1 = { task_Id: 0, description: "test-task-1", done: false };
    const JSON2 = { task_Id: 1, description: "test-task-2", done: false };

    assertEquals(task1.json(), JSON1);
    assertEquals(task2.json(), JSON2);
  });
});

describe("changeTaskDoneState", () => {
  it("should make the task status as true", () => {
    const task = new Task(0, "test-task");
    const expectedJSON = { task_Id: 0, description: "test-task", done: true };

    assertEquals(task.changeTaskDoneState(true).json(), expectedJSON);
  });

  it("should make the task status as false", () => {
    const task = new Task(0, "test-task");
    const expectedJSON = { task_Id: 0, description: "test-task", done: false };

    assertEquals(task.changeTaskDoneState(false).json(), expectedJSON);
  });
});
