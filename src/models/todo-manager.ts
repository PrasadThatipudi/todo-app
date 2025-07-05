import { Todo } from "./todo.ts";

class TodoManager {
  todos: Map<number, Todo> = new Map();
  taskIdGenerator: (start: number) => () => number;
  todoIdGenerator: () => number;

  private constructor(
    todoIdGenerator: () => number,
    taskIdGenerator: (start: number) => () => number,
  ) {
    this.todoIdGenerator = todoIdGenerator;
    this.taskIdGenerator = taskIdGenerator;
  }

  static init(
    todoIdGenerator: () => number,
    taskIdGenerator: (start: number) => () => number,
  ) {
    return new TodoManager(todoIdGenerator, taskIdGenerator);
  }

  addTodo(title: string): number {
    if (title.trim() === "") return -1;

    const todo = Todo.init(0, title, this.taskIdGenerator(0));
    this.todos.set(todo.id, todo);

    return todo.id;
  }

  addTask(todoId: number, taskDescription: string): number {
    const todo = this.getTodoById(todoId);

    if (!todo) return -1;

    return todo.addTask(taskDescription) ?? -1;
  }

  getTodoById(id: number): Todo | null {
    return this.todos.get(id) || null;
  }

  getAllTodos(): Todo[] {
    return Array.from(this.todos.values());
  }
}

export { TodoManager };
