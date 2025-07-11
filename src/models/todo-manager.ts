import { TaskJSON, TodoJSON } from "../types.ts";
import { Task } from "./task.ts";
import { Todo } from "./todo.ts";

class TodoManager {
  todos: Map<number, Todo> = new Map();
  taskIdGenerator: (start: number) => () => number;
  nextTodoId: () => number;

  private constructor(
    nextTodoId: () => number,
    taskIdGenerator: (start: number) => () => number,
  ) {
    this.nextTodoId = nextTodoId;
    this.taskIdGenerator = taskIdGenerator;
  }

  static init(
    nextTodoId: () => number,
    taskIdGenerator: (start: number) => () => number,
  ) {
    return new TodoManager(nextTodoId, taskIdGenerator);
  }

  hasTodo(lookUpKey: number | string): boolean {
    if (typeof lookUpKey === "number") return this.todos.has(Number(lookUpKey));

    return this.todos.values().some((todo) => todo.title === lookUpKey);
  }

  hasTask(todoId: number, lookUpKey: number | string): boolean {
    return this.hasTodo(todoId) && this.getTodoById(todoId)!.hasTask(lookUpKey);
  }

  addTodo(inputTitle: string): number {
    const title = inputTitle.trim();

    if (title === "") return -1;
    if (this.hasTodo(title)) return -1;

    const todo = Todo.init(this.nextTodoId(), title, this.taskIdGenerator(0));
    this.todos.set(todo.id, todo);

    return todo.id;
  }

  addTask(todoId: number, taskDescription: string): number {
    const todo = this.getTodoById(todoId);

    if (!todo) return -1;

    return todo.addTask(taskDescription) ?? -1;
  }

  toggleTask(todoId: number, taskId: number): boolean {
    return (
      this.todos.has(todoId) && this.getTodoById(todoId)!.toggleTask(taskId)
    );
  }

  removeTodo(todoId: number): Todo | null {
    if (!this.todos.has(todoId)) return null;

    const targetTodo = this.getTodoById(todoId);
    this.todos.delete(todoId);

    return targetTodo;
  }

  removeTask(todoId: number, taskId: number): Task | null {
    if (!this.todos.has(todoId)) return null;

    return this.getTodoById(todoId)!.removeTask(taskId);
  }

  getTodoById(id: number): Todo | null {
    return this.todos.get(id) || null;
  }

  getTaskJson(todoId: number, taskId: number): TaskJSON | null {
    if (!this.todos.has(todoId)) return null;

    const targetTodo = this.getTodoById(todoId);
    const targetTask = targetTodo?.getTaskById(taskId);

    return targetTask?.json() || null;
  }

  getAllTodos(): Todo[] {
    return Array.from(this.todos.values());
  }

  json(): TodoJSON[] {
    return this.getAllTodos().map((todo) => todo.json());
  }
}

export { TodoManager };
