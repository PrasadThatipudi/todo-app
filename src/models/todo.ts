import { TodoJSON } from "../types.ts";

class Todo {
  private readonly id: number;
  private readonly title: string;

  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
  }

  json(): TodoJSON {
    return { todo_ID: this.id, title: this.title, tasks: [] };
  }
}

export { Todo };
