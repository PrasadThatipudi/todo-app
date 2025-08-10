import { SessionManager } from "./models/session-manager.ts";
import { TaskManager } from "./models/task-manager.ts";
import { TodoManager } from "./models/todo-manager.ts";
import { UserManager } from "./models/user-manager.ts";

interface AppContext {
  todoManager: TodoManager;
  taskManager: TaskManager;
  userManager: UserManager;
  sessionManager: SessionManager;
  logger?: (message: string) => void;
}
interface TaskJSON {
  task_id: number;
  description: string;
  done: boolean;
}

interface Task {
  task_id: number;
  description: string;
  done: boolean;
  priority: number;
  todo_id: number;
  user_id: number;
}

interface Todo {
  todo_id: number;
  title: string;
  user_id: number;
}

interface User {
  user_id: number;
  username: string;
  password: string;
}

interface Session {
  session_id: number;
  user_id: number;
}

interface TodoJSON {
  todo_id: number;
  user_id: number;
  title: string;
  tasks: Task[];
}

interface AppVariables {
  todoManager: TodoManager;
  taskManager: TaskManager;
  userManager: UserManager;
  sessionManager: SessionManager;
  userId: number;
}

export type {
  AppContext,
  AppVariables,
  Session,
  Task,
  TaskJSON,
  Todo,
  TodoJSON,
  User,
};
