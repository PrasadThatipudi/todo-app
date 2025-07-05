import { TaskJSON } from "../types.ts";

class Task {
  private readonly id: number;
  private readonly description: string;
  private done: boolean;

  constructor(id: number, description: string, done: boolean = false) {
    this.id = id;
    this.description = description;
    this.done = done;
  }

  changeTaskDoneState(newDoneState: boolean): Task {
    this.done = newDoneState;

    return this;
  }

  json(): TaskJSON {
    return { task_ID: this.id, description: this.description, done: this.done };
  }
}

export { Task };
