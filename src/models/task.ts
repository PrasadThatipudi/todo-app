import { TaskJSON } from "../types.ts";

class Task {
  readonly id: number;
  readonly description: string;
  done: boolean;

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
    return { task_id: this.id, description: this.description, done: this.done };
  }
}

export { Task };
