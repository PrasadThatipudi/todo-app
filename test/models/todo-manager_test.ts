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
});

describe("getAllTodos", () => {
  it("should return an empty array when no todos are present", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);
    const todos = todoManager.getAllTodos();

    assert(Array.isArray(todos));
    assert(todos.length === 0);
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
});

describe("addTask", () => {
  it("should return -1 when task description is invalid", () => {
    const todoManager = TodoManager.init(() => 0, idGenerator);

    const todoId = todoManager.addTodo("Test Todo");
    const taskId = todoManager.addTask(todoId, "");

    assertEquals(taskId, -1);
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
      task_Id: 0,
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
        tasks: [{ task_Id: 0, description: "Test Task 1", done: false }],
      },
      { todo_Id: 1, title: "Test Todo 2", tasks: [] },
    ]);
  });
});
