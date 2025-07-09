import { TodoJSON } from "../types.ts";
import { TaskManager } from "./task-manager.ts";
import { Task } from "./task.ts";

class Todo {
  readonly id: number;
  private readonly title: string;
  readonly taskManager: TaskManager;

  private constructor(id: number, title: string, taskManager: TaskManager) {
    this.id = id;
    this.title = title;
    this.taskManager = taskManager;
  }

  static init(todoId: number, title: string, idGenerator: () => number): Todo {
    return new Todo(todoId, title, new TaskManager(idGenerator));
  }

  addTask(description: string): number | null {
    const addedTask = this.taskManager.addTask(description);

    return addedTask ? addedTask.id : null;
  }

  getTaskById(taskId: number): Task | null {
    return this.taskManager.getTaskById(taskId);
  }

  json(): TodoJSON {
    return {
      todo_Id: this.id,
      title: this.title,
      tasks: this.taskManager.json(),
    };
  }
}

export { Todo };
