import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { Task } from "../../src/models/task.ts";

describe("json", () => {
  it("should return task in json", () => {
    const task = new Task(0, "test-task");
    const expectedJSON = { task_ID: 0, description: "test-task", done: false };

    assertEquals(task.json(), expectedJSON);
  });
});
