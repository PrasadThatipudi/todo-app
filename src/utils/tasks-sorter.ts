import { Task } from "../types.ts";

const sortByTaskIdAsc = (first: Task, second: Task): number =>
  first.task_id - second.task_id;

const sortByTaskIdDesc = (first: Task, second: Task): number =>
  second.task_id - first.task_id;

const sortByTaskDescriptionAsc = (first: Task, second: Task): number =>
  first.description.localeCompare(second.description);

const sortByTaskDescriptionDesc = (first: Task, second: Task): number =>
  second.description.localeCompare(first.description);

const sortByStatusDoneAsc = (first: Task, second: Task): number =>
  Number(first.done) - Number(second.done);

const sortByStatusDoneDesc = (first: Task, second: Task): number =>
  Number(second.done) - Number(first.done);

const sortByPriorityAsc = (first: Task, second: Task): number =>
  first.priority - second.priority;

const sortByPriorityDesc = (first: Task, second: Task): number =>
  second.priority - first.priority;

const sortMixer = (...sortFunctions: Array<(a: Task, b: Task) => number>) => {
  return (a: Task, b: Task): number => {
    for (const sortFunction of sortFunctions) {
      const result = sortFunction(a, b);
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
