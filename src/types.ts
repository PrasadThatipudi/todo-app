interface TaskJSON {
  task_ID: number;
  description: string;
  done: boolean;
}

interface TodoJSON {
  todo_ID: number;
  title: string;
  tasks: TaskJSON[];
}

export type { TaskJSON, TodoJSON };
