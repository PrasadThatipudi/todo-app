import { TodoJSON } from "../types.ts";
import { TaskManager } from "./task-manager.ts";
import { Task } from "./task.ts";

class Todo {
  readonly id: number;
  readonly title: string;
  readonly taskManager: TaskManager;

  private constructor(id: number, title: string, taskManager: TaskManager) {
    this.id = id;
    this.title = title;
    this.taskManager = taskManager;
  }

  static init(todoId: number, title: string, idGenerator: () => number): Todo {
    return new Todo(todoId, title, new TaskManager(idGenerator));
  }

  getTaskById(taskId: number): Task | null {
    return this.taskManager.getTaskById(taskId);
  }

  hasTask(lookUpKey: number | string): boolean {
    return this.taskManager.hasTask(lookUpKey);
  }

  addTask(description: string): number | null {
    if (this.taskManager.hasTask(description)) return null;

    const taskId = this.taskManager.addTask(description);
    const addedTask = this.taskManager.getTaskById(taskId!);

    return addedTask ? addedTask.id : null;
  }

  toggleTask(taskId: number): boolean {
    return this.taskManager.toggleTaskDone(taskId);
  }

  removeTask(taskId: number): Task | null {
    return this.taskManager.removeTask(taskId);
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
