import { TaskJSON } from "../types.ts";
import { Task } from "./task.ts";

class TaskManager {
  private tasks: Map<number, Task> = new Map();
  private readonly idGenerator: () => number;

  constructor(idGenerator: () => number) {
    this.idGenerator = idGenerator;
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTaskById(taskId: number): Task | null {
    return this.tasks.get(taskId) || null;
  }

  addTask(description: string): Task | null {
    if (!description || description.trim() === "") return null;

    const taskId = this.idGenerator();
    this.tasks.set(taskId, new Task(taskId, description));

    return new Task(taskId, description);
  }

  removeTask(taskId: number): Task | null {
    const targetTask = this.getTaskById(taskId);

    if (!targetTask) return null;
    this.tasks.delete(taskId);

    return targetTask;
  }

  json(): TaskJSON[] {
    return this.getAllTasks().map((task) => task.json());
  }
}

export { TaskManager };
