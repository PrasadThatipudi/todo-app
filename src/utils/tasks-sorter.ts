import { TaskSorter } from "../types.ts";

const sortByTaskIdAsc: TaskSorter = (first, second) =>
  first.task_id - second.task_id;

const sortByTaskIdDesc: TaskSorter = (first, second) =>
  second.task_id - first.task_id;

const sortByTaskDescriptionAsc: TaskSorter = (first, second) =>
  first.description.localeCompare(second.description);

const sortByTaskDescriptionDesc: TaskSorter = (first, second) =>
  second.description.localeCompare(first.description);

const sortByStatusDoneAsc: TaskSorter = (first, second) =>
  Number(first.done) - Number(second.done);

const sortByStatusDoneDesc: TaskSorter = (first, second) =>
  Number(second.done) - Number(first.done);

const sortByPriorityAsc: TaskSorter = (first, second) =>
  first.priority - second.priority;

const sortByPriorityDesc: TaskSorter = (first, second) =>
  second.priority - first.priority;

const sortMixer = (...sorters: Array<TaskSorter>): TaskSorter => {
  return (first, second) => {
    for (const sorter of sorters) {
      const result = sorter(first, second);
      if (result !== 0) return result;
    }
    return 0;
  };
};

export {
  sortByTaskIdAsc,
  sortByTaskIdDesc,
  sortByTaskDescriptionAsc,
  sortByTaskDescriptionDesc,
  sortByStatusDoneAsc,
  sortByStatusDoneDesc,
  sortByPriorityAsc,
  sortByPriorityDesc,
  sortMixer,
};
