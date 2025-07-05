interface TaskJSON {
  task_Id: number;
  description: string;
  done: boolean;
}

interface TodoJSON {
  todo_Id: number;
  title: string;
  tasks: TaskJSON[];
}

export type { TaskJSON, TodoJSON };
