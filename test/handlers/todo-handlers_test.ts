import { describe, it } from "@std/testing/bdd";
import createApp from "../../src/app.ts";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assertEquals } from "@std/assert/equals";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

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
