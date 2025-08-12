import { describe } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { it } from "node:test";
import { Task } from "../../src/types.ts";
import {
  sortByPriorityAsc,
  sortByPriorityDesc,
  sortByStatusDoneAsc,
  sortByStatusDoneDesc,
  sortByTaskDescriptionAsc,
  sortByTaskDescriptionDesc,
  sortByTaskIdAsc,
  sortByTaskIdDesc,
  sortMixer,
} from "../../src/utils/tasks-sorter.ts";

const createTask = (
  id: number,
  description: string,
  done: boolean,
  priority = 0,
  todo_id = 0,
  user_id = 0
): Task => ({
  task_id: id,
  description,
  done,
  priority,
  todo_id,
  user_id,
});

describe("sortByTaskIdAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByTaskIdAsc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by task_id in ascending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false),
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
    ];

    const result = tasks.toSorted(sortByTaskIdAsc);

    assertEquals(result, [
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
      createTask(2, "Task 3", false),
    ]);
  });
});

describe("sortByTaskIdDesc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByTaskIdDesc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by task_id in descending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false),
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
    ];

    const result = tasks.toSorted(sortByTaskIdDesc);

    assertEquals(result, [
      createTask(2, "Task 3", false),
      createTask(1, "Task 2", true),
      createTask(0, "Task 1", false),
    ]);
  });
});

describe("sortByTaskDescriptionAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByTaskDescriptionAsc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by description in ascending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false),
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
    ];

    const result = tasks.toSorted(sortByTaskDescriptionAsc);

    assertEquals(result, [
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
      createTask(2, "Task 3", false),
    ]);
  });
});

describe("sortByTaskDescriptionDesc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByTaskDescriptionDesc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by description in descending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false),
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
    ];

    const result = tasks.toSorted(sortByTaskDescriptionDesc);

    assertEquals(result, [
      createTask(2, "Task 3", false),
      createTask(1, "Task 2", true),
      createTask(0, "Task 1", false),
    ]);
  });
});

describe("sortByStatusDoneAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByStatusDoneAsc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by status (done) in ascending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false),
      createTask(1, "Task 2", true),
      createTask(0, "Task 1", false),
    ];

    const result = tasks.toSorted(sortByStatusDoneAsc);

    assertEquals(result, [
      createTask(2, "Task 3", false),
      createTask(0, "Task 1", false),
      createTask(1, "Task 2", true),
    ]);
  });
});

describe("sortByStatusDoneDesc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByStatusDoneDesc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by status (done) in descending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false),
      createTask(1, "Task 2", true),
      createTask(0, "Task 1", false),
    ];

    const result = tasks.toSorted(sortByStatusDoneDesc);

    assertEquals(result, [
      createTask(1, "Task 2", true),
      createTask(2, "Task 3", false),
      createTask(0, "Task 1", false),
    ]);
  });
});

describe("sortByPriorityAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByPriorityAsc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority in ascending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", true, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const result = tasks.toSorted(sortByPriorityAsc);

    assertEquals(result, [
      createTask(1, "Task 2", true, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);
  });
});

describe("sortByPriorityDesc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(sortByPriorityDesc);

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority in descending order", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", true, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const result = tasks.toSorted(sortByPriorityDesc);

    assertEquals(result, [
      createTask(0, "Task 1", false, 3),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", true, 1),
    ]);
  });
});

describe("sortMixer", () => {
  it("should return array without sorting if no sorters are provided", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];
    const result = tasks.toSorted(sortMixer());

    assertEquals(result, tasks);
  });

  it("should return a function that sorts tasks by multiple criteria", () => {
    const tasks: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];
    const result = tasks.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdAsc)
    );

    assertEquals(result, [
      createTask(1, "Task 2", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);
  });
});

describe("sortByPriorityAsc + sortByTaskIdAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdAsc)
    );

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority and then by task_id in ascending order", () => {
    const tasksSet1: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const resultSet1 = tasksSet1.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet1, [
      createTask(1, "Task 2", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet2: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet2 = tasksSet2.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet2, [
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet3: Task[] = [
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet3 = tasksSet3.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet3, [
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(4, "Task 5", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);
  });
});

describe("sortByPriorityAsc + sortByTaskIdDesc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdDesc)
    );

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority and then by task_id in descending order", () => {
    const tasksSet1: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const resultSet1 = tasksSet1.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdDesc)
    );

    assertEquals(resultSet1, [
      createTask(1, "Task 2", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet2: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet2 = tasksSet2.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdDesc)
    );

    assertEquals(resultSet2, [
      createTask(3, "Task 4", false, 1),
      createTask(1, "Task 2", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet3: Task[] = [
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet3 = tasksSet3.toSorted(
      sortMixer(sortByPriorityAsc, sortByTaskIdDesc)
    );

    assertEquals(resultSet3, [
      createTask(3, "Task 4", false, 1),
      createTask(1, "Task 2", false, 1),
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);
  });
});

describe("sortByPriorityDesc + sortByTaskIdAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdAsc)
    );

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority and then by task_id in ascending order", () => {
    const tasksSet1: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const resultSet1 = tasksSet1.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdAsc)
    );

    assertEquals(resultSet1, [
      createTask(0, "Task 1", false, 3),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
    ]);

    const tasksSet2: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet2 = tasksSet2.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdAsc)
    );

    assertEquals(resultSet2, [
      createTask(0, "Task 1", false, 3),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", false, 1),
    ]);

    const tasksSet3: Task[] = [
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet3 = tasksSet3.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdAsc)
    );

    assertEquals(resultSet3, [
      createTask(0, "Task 1", false, 3),
      createTask(2, "Task 3", false, 2),
      createTask(4, "Task 5", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", false, 1),
    ]);
  });
});

describe("sortByPriorityDesc + sortByTaskIdDesc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdDesc)
    );

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority and then by task_id in descending order", () => {
    const tasksSet1: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const resultSet1 = tasksSet1.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdDesc)
    );

    assertEquals(resultSet1, [
      createTask(0, "Task 1", false, 3),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
    ]);

    const tasksSet2: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet2 = tasksSet2.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdDesc)
    );

    assertEquals(resultSet2, [
      createTask(0, "Task 1", false, 3),
      createTask(2, "Task 3", false, 2),
      createTask(3, "Task 4", false, 1),
      createTask(1, "Task 2", false, 1),
    ]);

    const tasksSet3: Task[] = [
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet3 = tasksSet3.toSorted(
      sortMixer(sortByPriorityDesc, sortByTaskIdDesc)
    );

    assertEquals(resultSet3, [
      createTask(0, "Task 1", false, 3),
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(3, "Task 4", false, 1),
      createTask(1, "Task 2", false, 1),
    ]);
  });
});

describe("sortByPriorityAsc + sortByStatusDoneAsc + sortByTaskIdAsc", () => {
  it("should return empty array if no tasks are present", () => {
    const tasks: Task[] = [];
    const result = tasks.toSorted(
      sortMixer(sortByPriorityAsc, sortByStatusDoneAsc, sortByTaskIdAsc)
    );

    assertEquals(result, []);
  });

  it("should return tasks sorted by priority, status (done), and task_id in ascending order", () => {
    const tasksSet1: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const resultSet1 = tasksSet1.toSorted(
      sortMixer(sortByPriorityAsc, sortByStatusDoneAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet1, [
      createTask(1, "Task 2", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet2: Task[] = [
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet2 = tasksSet2.toSorted(
      sortMixer(sortByPriorityAsc, sortByStatusDoneAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet2, [
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet3: Task[] = [
      createTask(4, "Task 5", false, 2),
      createTask(2, "Task 3", false, 2),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
      createTask(3, "Task 4", false, 1),
    ];

    const resultSet3 = tasksSet3.toSorted(
      sortMixer(sortByPriorityAsc, sortByStatusDoneAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet3, [
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", false, 1),
      createTask(2, "Task 3", false, 2),
      createTask(4, "Task 5", false, 2),
      createTask(0, "Task 1", false, 3),
    ]);

    const tasksSet4: Task[] = [
      createTask(5, "Task 6", false, 2),
      createTask(4, "Task 5", true, 2),
      createTask(2, "Task 3", false, 2),
      createTask(3, "Task 4", true, 1),
      createTask(1, "Task 2", false, 1),
      createTask(0, "Task 1", false, 3),
    ];

    const resultSet4 = tasksSet4.toSorted(
      sortMixer(sortByPriorityAsc, sortByStatusDoneAsc, sortByTaskIdAsc)
    );

    assertEquals(resultSet4, [
      createTask(1, "Task 2", false, 1),
      createTask(3, "Task 4", true, 1),
      createTask(2, "Task 3", false, 2),
      createTask(5, "Task 6", false, 2),
      createTask(4, "Task 5", true, 2),
      createTask(0, "Task 1", false, 3),
    ]);
  });
});
