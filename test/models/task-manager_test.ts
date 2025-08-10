import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { TaskManager } from "../../src/models/task-manager.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertObjectMatch,
  assertRejects,
} from "@std/assert";
import { Task } from "../../src/types.ts";
import { Collection, MongoClient } from "mongodb";
import { assertSpyCallArgs, stub } from "@std/testing/mock";

let client: MongoClient;
let collection: Collection<Task>;

beforeEach(async () => {
  client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  collection = client.db("test").collection("tasks");
  await collection.deleteMany({});
});

afterEach(async () => {
  await client.close();
});

describe("init", () => {
  it("should initialize the task manager", () => {
    const taskManager = TaskManager.init(() => 0, collection);
    assert(taskManager instanceof TaskManager);
  });
});

const userId = 0;
const todoId = 0;

const createTestTask = (
  task_id: number,
  description: string,
  todoId: number = 0,
  done: boolean = false
): Task => ({
  task_id,
  description,
  done,
  priority: 0,
  user_id: userId,
  todo_id: todoId,
});

describe("getAllTasks", () => {
  it("should return empty array initially", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const tasks = await taskManager.getAllTasks(userId, todoId);

    assertEquals(tasks, []);
  });

  it("should return all added tasks of the given todo", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);

    const task1: Task = createTestTask(0, "Test Task 1");
    const task2: Task = createTestTask(1, "Test Task 2");
    await taskManager.addTask(userId, todoId, task1.description);
    await taskManager.addTask(userId, todoId, task2.description);

    const tasks = await taskManager.getAllTasks(userId, todoId);

    assertEquals(tasks.length, 2);
    assertObjectMatch(
      tasks[0] as unknown as Record<string, unknown>,
      task1 as unknown as Record<string, unknown>
    );
    assertObjectMatch(
      tasks[1] as unknown as Record<string, unknown>,
      task2 as unknown as Record<string, unknown>
    );
  });

  it("should return tasks only for the specified user and todo", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);

    const task1: Task = createTestTask(0, "Test Task 1", 1);
    const task2: Task = createTestTask(1, "Test Task 2", 2);

    await taskManager.addTask(userId, 1, task1.description);
    await taskManager.addTask(userId, 2, task2.description);

    const tasksOfTodo1 = await taskManager.getAllTasks(userId, 1);
    const tasksOfTodo2 = await taskManager.getAllTasks(userId, 2);

    assertEquals(tasksOfTodo1.length, 1);
    assertObjectMatch(
      tasksOfTodo1[0] as unknown as Record<string, unknown>,
      task1 as unknown as Record<string, unknown>
    );

    assertEquals(tasksOfTodo2.length, 1);
    assertObjectMatch(
      tasksOfTodo2[0] as unknown as Record<string, unknown>,
      task2 as unknown as Record<string, unknown>
    );
  });

  it("should return tasks only for the specified user", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);

    const task1: Task = createTestTask(0, "Test Task 1", 1);
    const task2: Task = createTestTask(1, "Test Task 2", 2);

    await taskManager.addTask(userId, 1, task1.description);
    await taskManager.addTask(userId + 1, 2, task2.description);

    const tasksOfUser1 = await taskManager.getAllTasks(userId);
    assertEquals(tasksOfUser1.length, 1);
    assertObjectMatch(
      tasksOfUser1[0] as unknown as Record<string, unknown>,
      task1 as unknown as Record<string, unknown>
    );

    const tasksOfUser2 = await taskManager.getAllTasks(userId + 1);
    assertEquals(tasksOfUser2.length, 1);
  });
});

describe("getTaskById", () => {
  it("should return null for non-existing task", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const taskId = 1;
    const task = await taskManager.getTaskById(userId, todoId, taskId);

    assertEquals(task, null);
  });

  it("should return null for existing task with different userId", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const taskId = 1;
    const task: Task = createTestTask(taskId, "Test Task", todoId);
    await collection.insertOne(task);

    const fetchedTask = await taskManager.getTaskById(
      userId + 1,
      todoId,
      taskId
    );
    assertEquals(fetchedTask, null);
  });

  it("should return the added task", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const task: Task = createTestTask(0, "Test Task 1");
    await taskManager.addTask(userId, todoId, task.description);

    const newTask = await taskManager.getTaskById(userId, todoId, task.task_id);
    assertObjectMatch(
      newTask! as unknown as Record<string, unknown>,
      task as unknown as Record<string, unknown>
    );
  });
});

describe("hasTask", () => {
  it("should return false if the task is new", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    assertFalse(await taskManager.hasTask(userId, todoId, 0));
  });

  it("should return true if the task is existed", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    const taskId = await taskManager.addTask(userId, todoId, "Test Task")!;

    assert(await taskManager.hasTask(userId, todoId, taskId!));
  });

  it("should return false if the description is new", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    assertFalse(await taskManager.hasTask(userId, todoId, "Unknown Task"));
  });

  it("should return true if the description is exists", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    await taskManager.addTask(userId, todoId, "Test Task");
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 1);
    assert(await taskManager.hasTask(userId, todoId, "Test Task"));
  });
});

describe("addTask", () => {
  it("should add a task", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const task: Task = {
      task_id: 0,
      description: "test-task-1",
      done: false,
      priority: 0,
      user_id: userId,
      todo_id: todoId,
    };
    const taskId = await taskManager.addTask(userId, todoId, "test-task-1");
    const addedTask = await taskManager.getTaskById(userId, todoId, taskId!);

    assertObjectMatch(
      addedTask! as unknown as Record<string, unknown>,
      task as unknown as Record<string, unknown>
    );
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 1);
  });

  it("should add trimmed task description", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const task: Task = createTestTask(0, "test-task-1");
    const taskId = await taskManager.addTask(
      userId,
      todoId,
      "  test-task-1  "
    )!;
    const addedTask = await taskManager.getTaskById(userId, todoId, taskId!);

    assertObjectMatch(
      addedTask! as unknown as Record<string, unknown>,
      task as unknown as Record<string, unknown>
    );
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 1);
  });

  it("should use idGenerator to give id to task", async () => {
    const taskManager1 = TaskManager.init(() => 1, collection);
    const taskManager2 = TaskManager.init(() => 2, collection);

    const task1 = createTestTask(1, "test-task-1", 1);
    const task2 = createTestTask(2, "test-task-2", 2);
    const todo1 = 1;
    const todo2 = 2;
    const task1Id = await taskManager1.addTask(userId, todo1, "test-task-1")!;
    const addedTask1 = await taskManager1.getTaskById(userId, todo1, task1Id!);
    const task2Id = await taskManager2.addTask(userId, todo2, "test-task-2")!;
    const addedTask2 = await taskManager2.getTaskById(userId, todo2, task2Id!);

    assertEquals((await taskManager1.getAllTasks(userId, todo1)).length, 1);
    assertObjectMatch(
      addedTask1! as unknown as Record<string, unknown>,
      task1 as unknown as Record<string, unknown>
    );
    assertEquals((await taskManager2.getAllTasks(userId, todo2)).length, 1);
    assertObjectMatch(
      addedTask2! as unknown as Record<string, unknown>,
      task2 as unknown as Record<string, unknown>
    );
  });

  it("should throw an error if task description is empty", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "");
      },
      Error,
      "Task description cannot be empty"
    );

    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);
  });

  it("should throw an error if task description is only whitespace", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "   ");
      },
      Error,
      "Task description cannot be empty"
    );

    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);
  });

  it("should return null if task description already exists", async () => {
    const taskManager1 = TaskManager.init(() => 0, collection);

    await taskManager1.addTask(userId, todoId, "test-task-1");
    await assertRejects(
      async () => {
        await taskManager1.addTask(userId, todoId, "test-task-1");
      },
      Error,
      "Task description already exists"
    );

    assertEquals((await taskManager1.getAllTasks(userId, todoId)).length, 1);

    // Test with a different todoId
    const taskManager2 = TaskManager.init(() => 1, collection);
    await taskManager2.addTask(userId, todoId + 1, "test-task-1");
    await assertRejects(
      async () => {
        await taskManager2.addTask(userId, todoId + 1, "test-task-1");
      },
      Error,
      "Task description already exists"
    );
    assertEquals(
      (await taskManager2.getAllTasks(userId, todoId + 1)).length,
      1
    );

    // Test with a different userId
    const taskManager3 = TaskManager.init(() => 2, collection);
    await taskManager3.addTask(userId + 1, todoId, "test-task-1");
    await assertRejects(
      async () => {
        await taskManager3.addTask(userId + 1, todoId, "test-task-1");
      },
      Error,
      "Task description already exists"
    );
    assertEquals(
      (await taskManager3.getAllTasks(userId + 1, todoId)).length,
      1
    );
  });

  it("should throw an error if priority is a negative number", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "test-task-1", -1);
      },
      Error,
      "Priority cannot be negative"
    );

    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);
  });

  it("should throw an error if priority is NaN, -0, Infinity or -Infinity", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "test-task-1", NaN);
      },
      Error,
      "Invalid priority value"
    );

    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "test-task-1", Infinity);
      },
      Error,
      "Invalid priority value"
    );

    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "test-task-1", -Infinity);
      },
      Error,
      "Priority cannot be negative"
    );

    await assertRejects(
      async () => {
        await taskManager.addTask(userId, todoId, "test-task-1", -0);
      },
      Error,
      "Priority cannot be negative"
    );

    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);
  });

  it("should add task with priority 0 if not specified", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const taskId = await taskManager.addTask(userId, todoId, "test-task-1");
    const addedTask = await taskManager.getTaskById(userId, todoId, taskId!);

    assertEquals(addedTask!.priority, 0);
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 1);
  });

  it("should add task with specified priority", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const priority = 5;
    const taskId = await taskManager.addTask(
      userId,
      todoId,
      "test-task-1",
      priority
    );
    const addedTask = await taskManager.getTaskById(userId, todoId, taskId!);

    assertEquals(addedTask!.priority, priority);
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 1);
  });
});

describe("toggleTaskDone", () => {
  it("should toggle task done state", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const taskId = await taskManager.addTask(userId, todoId, "test-task-1")!;
    const task = await taskManager.getTaskById(userId, todoId, taskId!);

    assertEquals(task!.done, false);

    await taskManager.toggleTaskDone(userId, todoId, taskId!);
    assertEquals(
      (await taskManager.getTaskById(userId, todoId, taskId!))!.done,
      true
    );

    await taskManager.toggleTaskDone(userId, todoId, taskId!);
    assertEquals(
      (await taskManager.getTaskById(userId, todoId, taskId!))!.done,
      false
    );
  });

  it("should toggle task done for any todo", async () => {
    const idGenerator = (start: number) => () => start++;
    const todoId1 = 0;
    const todoId2 = 1;
    const taskManager = TaskManager.init(idGenerator(0), collection);

    const task1Id = await taskManager.addTask(userId, todoId1, "test-task-1")!;
    const task2Id = await taskManager.addTask(userId, todoId2, "test-task-2")!;

    const task1 = await taskManager.getTaskById(userId, todoId1, task1Id!);
    const task2 = await taskManager.getTaskById(userId, todoId2, task2Id!);

    assertEquals(task1!.done, false);
    assertEquals(task2!.done, false);
    assert(await taskManager.toggleTaskDone(userId, todoId1, task1Id!));
    assertEquals(
      (await taskManager.getTaskById(userId, todoId1, task1Id!))!.done,
      true
    );
    assert(await taskManager.toggleTaskDone(userId, todoId2, task2Id!));
    assertEquals(
      (await taskManager.getTaskById(userId, todoId2, task2Id!))!.done,
      true
    );
  });

  it("should throw an error if task does not exist", () => {
    const taskManager = TaskManager.init(() => 0, collection);

    const hasTaskStub = stub(
      taskManager,
      "hasTask",
      async () => await Promise.resolve(false)
    );

    assertRejects(
      async () => await taskManager.toggleTaskDone(userId, todoId, 1),
      Error,
      "Task not found"
    );

    assertRejects(
      async () => await taskManager.toggleTaskDone(userId + 1, todoId + 1, 1),
      Error,
      "Task not found"
    );
    assertSpyCallArgs(hasTaskStub, 0, [userId, todoId, 1]);
    assertSpyCallArgs(hasTaskStub, 1, [userId + 1, todoId + 1, 1]);
  });

  it("should call hasTask and getTaskById with correct parameters", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const hasTaskStub = stub(
      taskManager,
      "hasTask",
      async () => await Promise.resolve(true)
    );
    const getTaskByIdStub = stub(
      taskManager,
      "getTaskById",
      async () => await Promise.resolve(createTestTask(1, "test-task-1"))
    );

    await taskManager.toggleTaskDone(userId, todoId, 1);

    assertSpyCallArgs(hasTaskStub, 0, [userId, todoId, 1]);
    assertSpyCallArgs(getTaskByIdStub, 0, [userId, todoId, 1]);

    // Checking for another user and todo
    await taskManager.toggleTaskDone(userId + 1, todoId + 1, 1);

    assertSpyCallArgs(hasTaskStub, 1, [userId + 1, todoId + 1, 1]);
    assertSpyCallArgs(getTaskByIdStub, 1, [userId + 1, todoId + 1, 1]);
  });

  it("should update the task done state in the database for any user and todo", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);
    const userId1 = 0;
    const todoId1 = 0;
    const userId2 = 1;
    const todoId2 = 1;

    const taskId1 = await taskManager.addTask(userId1, todoId1, "test-task-1")!;
    const task1 = await taskManager.getTaskById(userId1, todoId1, taskId1!);

    assertEquals(task1!.done, false);

    await taskManager.toggleTaskDone(userId1, todoId1, taskId1!);
    assertEquals(
      (await taskManager.getTaskById(userId1, todoId1, taskId1!))!.done,
      true
    );

    const taskId2 = await taskManager.addTask(userId2, todoId2, "test-task-2")!;
    const task2 = await taskManager.getTaskById(userId2, todoId2, taskId2!);

    assertEquals(task2!.done, false);
    await taskManager.toggleTaskDone(userId2, todoId2, taskId2!);
    assertEquals(
      (await taskManager.getTaskById(userId2, todoId2, taskId2!))!.done,
      true
    );
  });
});

describe("removeTask", () => {
  it("should throw an error for non-existing task", async () => {
    const taskManager = TaskManager.init(() => 0, collection);
    const hasTaskStub = stub(
      taskManager,
      "hasTask",
      async () => await Promise.resolve(false)
    );

    await assertRejects(
      async () => {
        await taskManager.removeTask(userId, todoId, 1);
      },
      Error,
      "Task not found"
    );

    await assertRejects(
      async () => {
        await taskManager.removeTask(userId + 1, todoId + 1, 1);
      },
      Error,
      "Task not found"
    );

    assertSpyCallArgs(hasTaskStub, 0, [userId, todoId, 1]);
    assertSpyCallArgs(hasTaskStub, 1, [userId + 1, todoId + 1, 1]);
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);
  });

  it("should return the status of removal", async () => {
    const taskManager = TaskManager.init(() => 0, collection);

    const taskId = await taskManager.addTask(userId, todoId, "test-task-1")!;
    const removeStatus = await taskManager.removeTask(userId, todoId, taskId!);

    assertEquals(removeStatus, true);
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);
    assertEquals(await taskManager.getTaskById(userId, todoId, taskId!), null);
  });

  it("should remove the task with the given id from multiple tasks", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);

    const task1Id = await taskManager.addTask(userId, todoId, "test-task-1")!;
    const task2Id = await taskManager.addTask(userId, todoId, "test-task-2")!;

    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 2);

    const result1 = await taskManager.removeTask(userId, todoId, task1Id!);
    const result2 = await taskManager.removeTask(userId, todoId, task2Id!);

    assertEquals(result1, true);
    assertEquals(result2, true);
    assertEquals((await taskManager.getAllTasks(userId, todoId)).length, 0);

    assertEquals(await taskManager.getTaskById(userId, todoId, task1Id!), null);
    assertEquals(await taskManager.getTaskById(userId, todoId, task2Id!), null);
  });

  it("should remove the task with the given id from multiple todos", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);

    const todoId1 = 0;
    const todoId2 = 1;

    const task1Id = await taskManager.addTask(userId, todoId1, "test-task-1")!;
    const task2Id = await taskManager.addTask(userId, todoId2, "test-task-2")!;

    assertEquals((await taskManager.getAllTasks(userId, todoId1)).length, 1);
    assertEquals((await taskManager.getAllTasks(userId, todoId2)).length, 1);

    const result1 = await taskManager.removeTask(userId, todoId1, task1Id!);
    const result2 = await taskManager.removeTask(userId, todoId2, task2Id!);

    assertEquals(result1, true);
    assertEquals(result2, true);
    assertEquals((await taskManager.getAllTasks(userId, todoId1)).length, 0);
    assertEquals((await taskManager.getAllTasks(userId, todoId2)).length, 0);

    assertEquals(
      await taskManager.getTaskById(userId, todoId1, task1Id!),
      null
    );
    assertEquals(
      await taskManager.getTaskById(userId, todoId2, task2Id!),
      null
    );
  });

  it("should remove the task in database for any user & todo", async () => {
    const idGenerator = (start: number) => () => start++;
    const taskManager = TaskManager.init(idGenerator(0), collection);
    const userId1 = 0;
    const todoId1 = 0;
    const userId2 = 1;
    const todoId2 = 1;

    const taskId1 = await taskManager.addTask(userId1, todoId1, "test-task-1")!;
    const task1 = await taskManager.getTaskById(userId1, todoId1, taskId1!);

    assertObjectMatch(
      task1! as unknown as Record<string, unknown>,
      createTestTask(taskId1!, "test-task-1", todoId1) as unknown as Record<
        string,
        unknown
      >
    );
    await taskManager.removeTask(userId1, todoId1, taskId1!);
    assertEquals(
      await taskManager.getTaskById(userId1, todoId1, taskId1!),
      null
    );

    const taskId2 = await taskManager.addTask(userId2, todoId2, "test-task-2")!;
    const task2 = await taskManager.getTaskById(userId2, todoId2, taskId2!);

    const expectedTask2: Task = {
      ...createTestTask(taskId2!, "test-task-2", todoId2),
      user_id: userId2,
      todo_id: todoId2,
    };
    assertObjectMatch(
      task2! as unknown as Record<string, unknown>,
      expectedTask2 as unknown as Record<string, unknown>
    );
    await taskManager.removeTask(userId2, todoId2, taskId2!);
    assertEquals(
      await taskManager.getTaskById(userId2, todoId2, taskId2!),
      null
    );
  });
});
