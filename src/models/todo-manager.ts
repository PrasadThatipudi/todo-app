class TodoManager {
  private constructor() {}

  static init(_arg0: () => number) {
    return new TodoManager();
  }

  getAllTodos() {
    return [];
  }
}

export { TodoManager };
