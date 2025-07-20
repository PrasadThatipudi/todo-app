import { Collection } from "mongodb";
import { Todo } from "../types.ts";
class TodoManager {
  constructor(
    private readonly todoIdGenerator: () => number,
    private readonly todoCollection: Collection<Todo>,
  ) {}

  static init(
    todoIdGenerator: () => number,
    todoCollection: Collection<Todo>,
  ): TodoManager {
    return new TodoManager(todoIdGenerator, todoCollection);
  }

  async getAllTodos(userId: number): Promise<Todo[]> {
    return await this.todoCollection.find({ user_id: userId }).toArray();
  }

  async getTodoById(userId: number, todoId: number): Promise<Todo | null> {
    return await this.todoCollection.findOne({
      _id: todoId,
      user_id: userId,
    });
  }

  async hasTodo(userId: number, lookUp: number | string): Promise<boolean> {
    const lookUpKey = typeof lookUp === "number" ? "_id" : "title";

    return (
      (await this.todoCollection.countDocuments({
        [lookUpKey]: lookUp,
        user_id: userId,
      })) === 1
    );
  }

  async addTodo(userId: number, title: string): Promise<number> {
    if (!title || !title.trim()) throw new Error("Title cannot be empty");
    if (await this.hasTodo(userId, title)) {
      throw new Error("Todo with this title already exists");
    }

    const insertionResult = await this.todoCollection.insertOne({
      _id: this.todoIdGenerator(),
      user_id: userId,
      title: "Test Todo",
    });

    return insertionResult.insertedId as number;
  }

  async removeTodo(userId: number, todoId: number): Promise<boolean> {
    if (!(await this.hasTodo(userId, todoId))) {
      throw new Error("Todo not found");
    }

    return (
      (
        await this.todoCollection.deleteOne({
          _id: todoId,
          user_id: userId,
        })
      ).deletedCount === 1
    );
  }
}

export { TodoManager };
