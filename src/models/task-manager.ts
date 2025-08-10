import { Collection } from "mongodb";
import { Task } from "../types.ts";

class TaskManager {
  static init(
    idGenerator: () => number,
    collection: Collection<Task>
  ): TaskManager {
    return new TaskManager(idGenerator, collection);
  }

  constructor(
    private readonly idGenerator: () => number,
    private readonly collection: Collection<Task>
  ) {}

  async getAllTasks(userId: number, todoId?: number): Promise<Task[]> {
    if (todoId !== undefined)
      return await this.collection
        .find({ user_id: userId, todo_id: todoId })
        .toArray();

    return await this.collection.find({ user_id: userId }).toArray();
  }

  async getTaskById(
    userId: number,
    todoId: number,
    taskId: number
  ): Promise<Task | null> {
    return (
      (await this.collection.findOne({
        user_id: userId,
        todo_id: todoId,
        task_id: taskId,
      })) || null
    );
  }

  private isNumber(value: unknown): value is number {
    return typeof value === "number";
  }

  async hasTask(
    userId: number,
    todoId: number,
    lookUpValue: number | string
  ): Promise<boolean> {
    const lookUpKey = this.isNumber(lookUpValue) ? "task_id" : "description";

    const match = {
      user_id: userId,
      todo_id: todoId,
      [lookUpKey]: lookUpValue,
    };
    const matchedTasks = await this.collection.find(match).toArray();

    return matchedTasks.length > 0;
  }

  private isPriorityNotANumber(priority: number) {
    return (
      typeof priority !== "number" ||
      Object.is(priority, NaN) ||
      Object.is(priority, Infinity)
    );
  }

  private isPriorityNegative(priority: number) {
    return priority < 0 || Object.is(priority, -0);
  }

  async addTask(
    userId: number,
    todoId: number,
    potentialDescription: string,
    priority: number = 0
  ): Promise<number | null> {
    const description = potentialDescription.trim();
    if (!description) throw new Error("Task description cannot be empty!");

    if (this.isPriorityNegative(priority))
      throw new Error("Priority cannot be negative!");

    if (this.isPriorityNotANumber(priority))
      throw new Error("Priority must be a number!");

    if (await this.hasTask(userId, todoId, description))
      throw new Error("Task description already exists!");

    const taskId = this.idGenerator();
    const newTask: Task = {
      task_id: taskId,
      description,
      done: false,
      priority,
      user_id: userId,
      todo_id: todoId,
    };

    await this.collection.insertOne(newTask);
    return taskId;
  }

  async toggleTaskDone(
    userId: number,
    todoId: number,
    taskId: number
  ): Promise<boolean> {
    if (!(await this.hasTask(userId, todoId, taskId)))
      throw new Error("Task not found!");

    const task = await this.getTaskById(userId, todoId, taskId);

    const updateResult = await this.collection.updateOne(
      { user_id: userId, todo_id: todoId, task_id: taskId },
      { $set: { done: !task!.done } }
    );

    return updateResult.modifiedCount > 0;
  }

  async removeTask(
    userId: number,
    todoId: number,
    taskId: number
  ): Promise<boolean> {
    if (!(await this.hasTask(userId, todoId, taskId)))
      throw new Error("Task not found!");

    const deletionResult = await this.collection.deleteOne({
      user_id: userId,
      todo_id: todoId,
      task_id: taskId,
    });

    return deletionResult.deletedCount > 0;
  }
}

export { TaskManager };
