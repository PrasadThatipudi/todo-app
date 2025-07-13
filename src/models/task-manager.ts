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

  hasTask(lookUpKey: number | string): boolean {
    // lookUpKey -> taskId
    if (typeof lookUpKey === "number") return this.tasks.has(lookUpKey);

    //lookUpKey -> description
    return this.tasks
      .values()
      .some(
        (task: Task) =>
          task.description.toLowerCase() === lookUpKey.toLowerCase(),
      );
  }

  addTask(inputDescription: string): number | null {
    const description = inputDescription.trim();

    if (!description || this.hasTask(description)) return null;

    const taskId = this.idGenerator();
    this.tasks.set(taskId, new Task(taskId, description));

    return taskId;
  }

  toggleTaskDone(taskId: number): boolean {
    const targetTask = this.getTaskById(taskId);

    if (!targetTask) return false;

    targetTask.changeTaskDoneState(!targetTask.done);
    return true;
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
