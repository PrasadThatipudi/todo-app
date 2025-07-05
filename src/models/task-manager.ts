import { Task } from "./task.ts";

class TaskManager {
  private readonly tasks: Task[] = [];
  private readonly idGenerator: () => number;

  constructor(idGenerator: () => number) {
    this.idGenerator = idGenerator;
  }

  getAllTasks(): Task[] {
    return this.tasks;
  }

  getTaskById(taskId: number): Task | null {
    return this.tasks.find((task) => task.id === taskId) || null;
  }

  addTask(description: string): Task {
    const task = new Task(this.idGenerator(), description);
    this.tasks.push(task);

    return task;
  }
}

export { TaskManager };
