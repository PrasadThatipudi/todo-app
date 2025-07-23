import { TaskManager } from "./models/task-manager.ts";
import { TodoManager } from "./models/todo-manager.ts";

interface Student {
  id: number;
  name: string;
  age: number;
}
interface AppContext {
  todoManager: TodoManager;
  taskManager: TaskManager;
  logger?: (message: string) => void;
}
interface TaskJSON {
  task_id: number;
  description: string;
  done: boolean;
}

interface Task {
  _id: number;
  description: string;
  done: boolean;
  todo_id: number;
  user_id: number;
}

interface Todo {
  _id: number;
  title: string;
  user_id: number;
}

interface User {
  _id: number;
  username: string;
  password: string;
}

interface Session {
  _id: number;
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
  userId: number;
}

export type {
  AppContext,
  AppVariables,
  Session,
  Student,
  Task,
  TaskJSON,
  Todo,
  TodoJSON,
  User,
};
