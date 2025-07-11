import { assert, assertEquals, assertFalse } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Todo } from "../../src/models/todo.ts";
import { TodoJSON } from "../../src/types.ts";
import { TaskManager } from "../../src/models/task-manager.ts";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

describe("init", () => {
  it("should initialize a todo with id, title and taskManager", () => {
    const todo = Todo.init(0, "testing", () => 0);

    assert(todo instanceof Todo);
    assert(todo.taskManager instanceof TaskManager);
    assertEquals(todo.json(), { todo_Id: 0, title: "testing", tasks: [] });
  });
});

describe("getTaskById", () => {
  it("should return task by id", () => {
    const taskJSON = { task_id: 0, description: "test-task", done: false };

    const todo = Todo.init(0, "testing", () => 0);
    const taskId = todo.addTask(taskJSON.description);

    const task = todo.getTaskById(taskId!);

    assert(task !== null);
    assertEquals(task?.json(), taskJSON);
  });

  it("should return null if task does not exist", () => {
    const todo = Todo.init(0, "testing", () => 0);
    const task = todo.getTaskById(999);

    assertEquals(task, null);
  });
});

describe("hasTask", () => {
  it("should return false if task is not exists in todo", () => {
    const todo = Todo.init(0, "testing", () => 0);

    assertFalse(todo.hasTask(0));
  });

  it("should return true if task is exists in todo", () => {
    const todo = Todo.init(0, "testing", () => 0);
    const taskId = todo.addTask("Test Task");

    assert(todo.hasTask(taskId!));
  });

  it("should return false if task description not exists in todo", () => {
    const todo = Todo.init(0, "testing", () => 0);

    assertFalse(todo.hasTask("Non-existent Task"));
  });

  it("should return true if task description exists in todo", () => {
    const todo = Todo.init(0, "testing", () => 0);
    todo.addTask("Existing Task");

    assert(todo.hasTask("Existing Task"));
  });
});

describe("addTask", () => {
  it("should add a task and return its id", () => {
    const taskJSON = { task_id: 0, description: "test-task", done: false };
    const todo = Todo.init(0, "testing", () => 0);
    const taskId = todo.addTask(taskJSON.description);

    assertEquals(taskId, 0);
    assertEquals(todo.taskManager.getAllTasks().length, 1);
    assertEquals(todo.taskManager.getTaskById(taskId!)?.json(), taskJSON);
  });

  it("should add a task with trimmed description", () => {
    const taskJSON = { task_id: 0, description: "test-task", done: false };
    const todo = Todo.init(0, "testing", () => 0);
    const taskId = todo.addTask("  test-task  ");

    assertEquals(taskId, 0);
    assertEquals(todo.taskManager.getAllTasks().length, 1);
    assertEquals(todo.taskManager.getTaskById(taskId!)?.json(), taskJSON);
  });

  it("should return null if task description is empty string", () => {
    const todo = Todo.init(0, "testing", () => 0);
    const taskId = todo.addTask("");

    assertEquals(taskId, null);
    assertEquals(todo.taskManager.getAllTasks().length, 0);
  });

  it("should use idGenerator to give id to task", () => {
    const todo1 = Todo.init(0, "testing-1", () => 1);
    const todo2 = Todo.init(1, "testing-2", () => 2);

    const taskJSON1 = { task_id: 1, description: "test-task-1", done: false };
    const taskJSON2 = { task_id: 2, description: "test-task-2", done: false };

    const taskId1 = todo1.addTask(taskJSON1.description);
    const taskId2 = todo2.addTask(taskJSON2.description);

    assertEquals(taskId1, 1);
    assertEquals(taskId2, 2);
    assertEquals(todo1.taskManager.getAllTasks().length, 1);
    assertEquals(todo2.taskManager.getAllTasks().length, 1);
    assertEquals(todo1.taskManager.getTaskById(taskId1!)?.json(), taskJSON1);
    assertEquals(todo2.taskManager.getTaskById(taskId2!)?.json(), taskJSON2);
  });

  it("should return null if the given task is already existed", () => {
    const todo = Todo.init(0, "testing-1", () => 1);

    const taskId1 = todo.addTask("Test Task");
    const taskId2 = todo.addTask("Test Task"); // Adding a duplicate task

    assertEquals(taskId1, 1);
    assertEquals(taskId2, null);
  });
});

describe("toggleTask", () => {
  it("should call toggleTaskDone on the taskManager", () => {
    const todo = Todo.init(0, "testing", () => 0);
    const taskId = todo.addTask("Test Task");

    const taskManagerStub = stub(
      todo.taskManager,
      "toggleTaskDone",
      () => true,
    );
    const result = todo.toggleTask(taskId!);
    assert(result);
    assertSpyCallArgs(taskManagerStub, 0, [taskId!]);
  });
});

describe("json", () => {
  it("create a todo with title and id | tasks as empty array", () => {
    const todo = Todo.init(0, "testing", () => 0);
    const todoJSON: TodoJSON = { todo_Id: 0, title: "testing", tasks: [] };

    assertEquals(todo.json(), todoJSON);
  });

  it("should accept any title and id", () => {
    const todo1 = Todo.init(0, "testing-1", () => 0);
    const todo2 = Todo.init(1, "testing-2", () => 0);

    const todoJSON1: TodoJSON = { todo_Id: 0, title: "testing-1", tasks: [] };
    const todoJSON2: TodoJSON = { todo_Id: 1, title: "testing-2", tasks: [] };

    assertEquals(todo1.json(), todoJSON1);
    assertEquals(todo2.json(), todoJSON2);
  });

  it("should return tasks which involved in todo", () => {
    const idGenerator = (start: number) => () => start++;
    const todo = Todo.init(0, "testing", idGenerator(0));
    const task1Id = todo.addTask("task-1");
    const task2Id = todo.addTask("task-2");

    assertEquals(task1Id, 0);
    assertEquals(task2Id, 1);

    const todoJSON: TodoJSON = {
      todo_Id: 0,
      title: "testing",
      tasks: [
        { task_id: task1Id!, description: "task-1", done: false },
        { task_id: task2Id!, description: "task-2", done: false },
      ],
    };

    assertEquals(todo.json(), todoJSON);
  });
});
