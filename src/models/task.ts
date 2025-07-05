import { TaskJSON } from "../types.ts";

class Task {
  private readonly id: number;
  private readonly description: string;

  constructor(id: number, description: string) {
    this.id = id;
    this.description = description;
  }

  json(): TaskJSON {
    return { task_ID: 0, description: "test-task", done: false };
  }
}

export { Task };
