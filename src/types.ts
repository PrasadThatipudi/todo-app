import { TodoManager } from "./models/todo-manager.ts";

interface AppContext {
  todoManager: TodoManager;
}
interface TaskJSON {
  task_id: number;
  description: string;
  done: boolean;
}

interface TodoJSON {
  todo_Id: number;
  title: string;
  tasks: TaskJSON[];
}

interface AppVariables {
  todoManager: TodoManager;
}

export type { AppContext, AppVariables, TaskJSON, TodoJSON };
