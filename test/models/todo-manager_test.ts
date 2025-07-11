import { describe, it } from "@std/testing/bdd";
import { assertSpyCallArgs, stub } from "@std/testing/mock";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { TaskJSON, TodoJSON } from "../../src/types.ts";
import { Task } from "../../src/models/task.ts";
import { assertFalse } from "@std/assert/false";

const idGenerator = (start: number) => () => start++;

describe("init", () => {
  it("should initialize the TodoManager", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    assert(todoManager instanceof TodoManager);
  });
});

describe("hasTodo", () => {
  it("should return false if the todo is not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    assertFalse(todoManager.hasTodo(0));
  });

  it("should return true if the todo is exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test");

    assert(todoManager.hasTodo(todoId));
  });

  it("should return false if title is not exists", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    assertFalse(todoManager.hasTodo("Non-existent Todo"));
  });

  it("should return true if title is exists", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    todoManager.addTodo("Existing Todo");

    assert(todoManager.hasTodo("Existing Todo"));
  });
});

describe("hasTask", () => {
  it("should return false if the task is not exist in the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");

    assertFalse(todoManager.hasTask(todoId, 0));
  });

  it("should return true if the task is exist in the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    todoManager.addTask(todoId, "Test Task");

    assert(todoManager.hasTask(todoId, 0));
  });

  it("should return false if the todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    assertFalse(todoManager.hasTask(999, 0));
  });

  it("should return false if the task description does not exist in the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");

    assertFalse(todoManager.hasTask(todoId, "Non-existent Task"));
  });

  it("should return true if the task description exists in the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    todoManager.addTask(todoId, "Existing Task");

    assert(todoManager.hasTask(todoId, "Existing Task"));
  });
});

describe("getAllTodos", () => {
  it("should return an empty array when no todos are present", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todos = todoManager.getAllTodos();

    assert(Array.isArray(todos));
    assert(todos.length === 0);
  });
});

describe("getTodoById", () => {
  it("should return null when todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todo = todoManager.getTodoById(999);

    assertEquals(todo, null);
  });

  it("should return the correct todo when it exists", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodoId = todoManager.addTodo("Test Todo");
    const todo = todoManager.getTodoById(addedTodoId);

    assert(todo !== null);
  });
});

describe("addTodo", () => {
  it("should return -1 if title is empty string", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodo = todoManager.addTodo("");

    assertEquals(todoManager.getAllTodos().length, 0);
    assertEquals(addedTodo, -1);
  });

  it("should return -1 if title is empty string after trim", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodo = todoManager.addTodo("");

    assertEquals(todoManager.getAllTodos().length, 0);
    assertEquals(addedTodo, -1);
  });

  it("should add trimmed title", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodo = todoManager.addTodo("   Test Todo   ");

    assertEquals(addedTodo, 0);
    assertEquals(todoManager.getTodoById(addedTodo)?.title, "Test Todo");
  });

  it("should return added todo when title is valid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodoId = todoManager.addTodo("Test Todo");

    const allTodos = todoManager.getAllTodos();
    assertEquals(allTodos.length, 1);
    assertEquals(addedTodoId, 0);
  });

  it("should able to add multiple todos", () => {
    const todoManager = TodoManager.init(idGenerator(0), idGenerator);
    const addedTodoId1 = todoManager.addTodo("Test Todo 1");
    const addedTodoId2 = todoManager.addTodo("Test Todo 2");

    const allTodos = todoManager.getAllTodos();
    assertEquals(allTodos.length, 2);
    assertEquals(addedTodoId1, 0);
    assertEquals(addedTodoId2, 1);
  });

  it("should return -1 if title is already exists", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    todoManager.addTodo("Test Todo");
    const addedTodoId = todoManager.addTodo("Test Todo");

    assertEquals(addedTodoId, -1);
    assertEquals(todoManager.getAllTodos().length, 1);
  });
});

describe("addTask", () => {
  it("should return -1 when task description is invalid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "");

    assertEquals(taskId, -1);
  });

  it("should add trimmed task description", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "   Test Task   ");

    const task = todoManager.getTodoById(todoId)?.getTaskById(taskId);

    assertEquals(task?.description, "Test Task");
  });

  it("should return -1 when todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const taskId = todoManager.addTask(999, "Test Task");

    assertEquals(taskId, -1);
  });

  it("should return task id when task description is valid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");

    stub(todoManager.getTodoById(todoId)!, "addTask", () => 0);

    const taskId = todoManager.addTask(todoId, "Test Task");
    assertEquals(taskId, 0);
  });
});

describe("toggleTask", () => {
  it("should return false if todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const result = todoManager.toggleTask(999, 0);
    assertFalse(result);
  });

  it("should call toggleTask on the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "Test Task");
    const todo = todoManager.getTodoById(todoId)!;
    const toggleTaskStub = stub(todo, "toggleTask", () => true);

    const result = todoManager.toggleTask(todoId, taskId);
    assert(result);
    assertSpyCallArgs(toggleTaskStub, 0, [taskId]);
  });
});

describe("removeTodo", () => {
  it("should remove a todo by id and return removed todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const addedTodoId = todoManager.addTodo("Test Todo");

    const removedTodo = todoManager.removeTodo(addedTodoId)!;

    assertEquals(removedTodo.id, addedTodoId);
  });

  it("should return null when todo id is not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const result = todoManager.removeTodo(999);

    assertEquals(result, null);
  });
});

describe("removeTask", () => {
  it("should return null if todo does not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const result = todoManager.removeTask(999, 0);
    assertEquals(result, null);
  });

  it("should return null if task does not exist in the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const result = todoManager.removeTask(todoId, 0);

    assertEquals(result, null);
  });

  it("should call removeTask on the todo and return removed task", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "Test Task");
    const todo = todoManager.getTodoById(todoId)!;
    const removedTask = new Task(taskId, "Test Task");

    const removeTaskStub = stub(todo, "removeTask", () => removedTask);

    const result = todoManager.removeTask(todoId, taskId);
    assertEquals(result, removedTask);
    assertSpyCallArgs(removeTaskStub, 0, [taskId]);
  });
});

describe("getTaskJson", () => {
  it("should return null if todoId is not exist", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    assertEquals(todoManager.getTaskJson(0, 0), null);
  });

  it("should return null if taskId is not exist in the todo", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    todoManager.addTodo("Test Todo");

    assertEquals(todoManager.getTaskJson(0, 0), null);
  });

  it("should return task in json", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todoId = todoManager.addTodo("Test Todo");
    const todo = todoManager.getTodoById(todoId)!;

    const expectedTaskJson: TaskJSON = {
      task_id: 0,
      description: "Test Task",
      done: false,
    };

    const task = new Task(0, "Test Task");
    const getTaskStub = stub(todo, "getTaskById", () => task);
    const jsonTaskStub = stub(task, "json", () => expectedTaskJson);

    assertEquals(todoManager.getTaskJson(0, 0), task.json());
    assertSpyCallArgs(getTaskStub, 0, [0]);
    assertSpyCallArgs(jsonTaskStub, 1, []);
  });
});

describe("json", () => {
  it("should return an empty array when no todos are present", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todos: TodoJSON[] = todoManager.json();

    assertEquals(todos, []);
  });

  it("should return all todos in json format", () => {
    const todoManager = TodoManager.init(idGenerator(0), idGenerator);

    todoManager.addTodo("Test Todo 1");
    todoManager.addTask(0, "Test Task 1");
    todoManager.addTodo("Test Todo 2");

    const todos: TodoJSON[] = todoManager.json();
    assertEquals(todos.length, 2);
    assertEquals(todos, [
      {
        todo_Id: 0,
        title: "Test Todo 1",
        tasks: [{ task_id: 0, description: "Test Task 1", done: false }],
      },
      { todo_Id: 1, title: "Test Todo 2", tasks: [] },
    ]);
  });
});
