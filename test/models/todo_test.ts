import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Todo } from "../../src/models/todo.ts";
import { TodoJSON } from "../../src/types.ts";

describe("json", () => {
  it("create a todo with title and id | tasks as empty array", () => {
    const todo = new Todo(0, "testing");
    const todoJSON: TodoJSON = { todo_ID: 0, title: "testing", tasks: [] };

    assertEquals(todo.json(), todoJSON);
  });

  it("should accept any title and id", () => {
    const todo1 = new Todo(0, "testing-1");
    const todo2 = new Todo(1, "testing-2");

    const todoJSON1: TodoJSON = { todo_ID: 0, title: "testing-1", tasks: [] };
    const todoJSON2: TodoJSON = { todo_ID: 1, title: "testing-2", tasks: [] };

    assertEquals(todo1.json(), todoJSON1);
    assertEquals(todo2.json(), todoJSON2);
  });
});
