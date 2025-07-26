import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { TodoManager } from "../../src/models/todo-manager.ts";
import { assert } from "@std/assert/assert";
import { Todo } from "../../src/types.ts";
import { Collection, MongoClient } from "mongodb";
import {
  assertEquals,
  assertFalse,
  assertObjectMatch,
  assertRejects,
} from "@std/assert";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

let client: MongoClient;
let todoCollection: Collection<Todo>;
const userId = 0;

beforeEach(async () => {
  client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  todoCollection = client.db("test").collection("todos");
  await todoCollection.deleteMany({});
});

afterEach(async () => {
  await client.close();
});

const testIdGenerator = () => 0;
const idGenerator = (start: number) => () => start++;

const createTodo = (
  todo_id: number,
  title: string,
  user_id = userId,
): Todo => ({
  user_id,
  title,
  todo_id,
});

describe("init", () => {
  it("should initialize the TodoManager", () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);

    assert(todoManager instanceof TodoManager);
  });
});

describe("getAllTodos", () => {
  it("should return an empty array when no todos are present", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);

    const userId = 1;
    const todos: Todo[] = await todoManager.getAllTodos(userId);

    assert(todos.length === 0);
  });

  it("should return all todos for a user", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    await todoCollection.insertMany([
      createTodo(1, "Todo 1", 1),
      createTodo(2, "Todo 2", 1),
      createTodo(3, "Todo 3", 2),
    ]);

    const todos = await todoManager.getAllTodos(1);

    assertEquals(todos.length, 2);
    assertEquals(todos[0].title, "Todo 1");
    assertEquals(todos[1].title, "Todo 2");
  });
});

describe("getTodoById", () => {
  it("should return null when todo does not exist", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const todo = await todoManager.getTodoById(userId, 999);

    assertEquals(todo, null);
  });

  it("should return the correct todo when it exists", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const addedTodoId = await todoManager.addTodo(userId, "Test Todo");
    const todo = await todoManager.getTodoById(userId, addedTodoId);

    assert(todo !== null);
  });

  it("should return the correct todo with the specified userId", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    await todoCollection.insertOne(createTodo(1, "Test Todo", 1));
    const todo = await todoManager.getTodoById(1, 1);

    assert(todo !== null);
    assertEquals(todo?.title, "Test Todo");
  });
});

describe("hasTodo", () => {
  it("should return false if the todo is not exist", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);

    assertFalse(await todoManager.hasTodo(userId, 0));
  });

  it("should return true if the todo is exists", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const todoId = await todoManager.addTodo(userId, "Test");

    assert(await todoManager.hasTodo(userId, todoId));
  });

  it("should return true if the todo is exists for every specific user", async () => {
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const countStub = stub(
      todoCollection,
      "countDocuments",
      () => Promise.resolve(1),
    );
    const todoId1 = 0;
    const todoId2 = 2;
    await todoCollection.insertMany([
      createTodo(todoId1, "Test1", 0),
      createTodo(todoId2, "Test2", 1),
    ]);

    assert(await todoManager.hasTodo(0, todoId1));

    assert(await todoManager.hasTodo(1, todoId2));
    assertSpyCallArgs(countStub, 0, [{ todo_id: todoId1, user_id: 0 }]);
    assertSpyCallArgs(countStub, 1, [{ todo_id: todoId2, user_id: 1 }]);
  });

  it("should return false if title is not exists", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);

    assertFalse(await todoManager.hasTodo(userId, "Non-existent Todo"));
  });

  it("should return true if title is exists", async () => {
    const todoManager = TodoManager.init(() => 0, todoCollection);

    await todoCollection.insertOne(createTodo(0, "Existing Todo", userId));

    assert(await todoManager.hasTodo(userId, "Existing Todo"));
  });
});

describe("addTodo", () => {
  it("should throw an error if title is empty", () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    assertRejects(
      async () => {
        await todoManager.addTodo(userId, "");
      },
      Error,
      "Title cannot be empty",
    );
  });

  it("should throw an error if title is whitespace", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    assertRejects(
      async () => {
        await todoManager.addTodo(userId, "  ");
      },
      Error,
      "Title cannot be empty",
    );
    assertEquals((await todoManager.getAllTodos(userId)).length, 0);
  });

  it("should throw an error if title is exists", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    await todoManager.addTodo(userId, "Test Todo");

    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(true),
    );

    await assertRejects(
      async () => {
        await todoManager.addTodo(userId, "Test Todo");
      },
      Error,
      "Todo with this title already exists",
    );

    assertSpyCallArgs(hasTodoStub, 0, [userId, "Test Todo"]);
    assertEquals((await todoManager.getAllTodos(userId)).length, 1);
  });

  it("should accept title which is already exists for another user", async () => {
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(false),
    );

    const todoIdOfUser1 = await todoManager.addTodo(1, "Test Todo");
    const todoIdOfUser2 = await todoManager.addTodo(2, "Test Todo");

    const allTodosOfUser1 = await todoManager.getAllTodos(1);
    const allTodosOfUser2 = await todoManager.getAllTodos(2);
    assertSpyCallArgs(hasTodoStub, 0, [1, "Test Todo"]);
    assertSpyCallArgs(hasTodoStub, 1, [2, "Test Todo"]);
    assertEquals(todoIdOfUser2, 1);
    assertEquals(todoIdOfUser1, 0);
    assertEquals(allTodosOfUser1.length, 1);
    assertEquals(allTodosOfUser2.length, 1);
    assertObjectMatch(
      allTodosOfUser1[0],
      createTodo(0, "Test Todo", 1) as unknown as Record<string, unknown>,
    );
    assertObjectMatch(
      allTodosOfUser2[0],
      createTodo(1, "Test Todo", 2) as unknown as Record<string, unknown>,
    );
  });

  it("should return added todo id when title is valid", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const addedTodoId = await todoManager.addTodo(userId, "Test Todo");

    const allTodos = await todoManager.getAllTodos(userId);
    assertEquals(addedTodoId, 0);
    assertEquals(allTodos.length, 1);
  });

  it("should add trimmed title", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const todoId = await todoManager.addTodo(userId, "   Test Todo   ");

    assertEquals(todoId, 0);
    assertEquals(
      (await todoManager.getTodoById(userId, todoId))?.title,
      "Test Todo",
    );
  });

  it("should able to add multiple todos", async () => {
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const addedTodoId1 = await todoManager.addTodo(userId, "Test Todo 1");
    const addedTodoId2 = await todoManager.addTodo(userId, "Test Todo 2");

    const allTodos = await todoManager.getAllTodos(userId);
    assertEquals(allTodos.length, 2);
    assertEquals(addedTodoId1, 0);
    assertEquals(addedTodoId2, 1);
    assertObjectMatch(
      allTodos[0],
      createTodo(0, "Test Todo 1", userId) as unknown as Record<
        string,
        unknown
      >,
    );
    assertObjectMatch(
      allTodos[1],
      createTodo(1, "Test Todo 2", userId) as unknown as Record<
        string,
        unknown
      >,
    );
  });
});

describe("removeTodo", () => {
  it("should throw an error if todo does not exist", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(false),
    );

    await assertRejects(
      async () => {
        await todoManager.removeTodo(userId, 999);
      },
      Error,
      "Todo not found",
    );

    assertSpyCallArgs(hasTodoStub, 0, [userId, 999]);
  });

  it("should remove the todo if it exists | returns true", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const addedTodoId = await todoManager.addTodo(userId, "Test Todo");
    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(true),
    );

    const result = await todoManager.removeTodo(userId, addedTodoId);

    assert(result);
    assertSpyCallArgs(hasTodoStub, 0, [userId, addedTodoId]);
    assertEquals((await todoManager.getAllTodos(userId)).length, 0);
  });

  it("should remove the todo with the specified userId", async () => {
    const todoManager = TodoManager.init(testIdGenerator, todoCollection);
    const addedTodoId = await todoManager.addTodo(1, "Test Todo");
    const hasTodoStub = stub(
      todoManager,
      "hasTodo",
      () => Promise.resolve(true),
    );

    const result = await todoManager.removeTodo(1, addedTodoId);

    assertSpyCallArgs(hasTodoStub, 0, [1, addedTodoId]);
    assert(result);
    assertEquals((await todoManager.getAllTodos(1)).length, 0);
  });

  it("should able to remove multiple todos", async () => {
    const todoManager = TodoManager.init(idGenerator(0), todoCollection);
    const userId = 0;
    const todoId1 = await todoManager.addTodo(userId, "Test Todo 1");
    const todoId2 = await todoManager.addTodo(userId, "Test Todo 2");

    assertEquals((await todoManager.getAllTodos(userId)).length, 2);

    assert(await todoManager.removeTodo(userId, todoId1));
    assertEquals((await todoManager.getAllTodos(userId)).length, 1);

    assert(await todoManager.removeTodo(userId, todoId2));
    assertEquals((await todoManager.getAllTodos(userId)).length, 0);
  });
});
