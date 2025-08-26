import { SortKey, TaskSorter } from "../types.ts";
import {
  sortByPriorityAsc,
  sortByPriorityDesc,
  sortByStatusDoneAsc,
  sortByStatusDoneDesc,
  sortByTaskDescriptionAsc,
  sortByTaskDescriptionDesc,
  sortByTaskIdAsc,
  sortByTaskIdDesc,
  sortByTaskInsertionTimeAsc,
  sortByTaskInsertionTimeDesc,
} from "./tasks-sorter.ts";

const sortEntries: [key: SortKey, sorter: TaskSorter][] = [
  ["priority:asc", sortByPriorityAsc],
  ["priority:desc", sortByPriorityDesc],
  ["task_id:asc", sortByTaskIdAsc],
  ["task_id:desc", sortByTaskIdDesc],
  ["description:asc", sortByTaskDescriptionAsc],
  ["description:desc", sortByTaskDescriptionDesc],
  ["status:asc", sortByStatusDoneAsc],
  ["status:desc", sortByStatusDoneDesc],
  ["task_insertion_time:asc", sortByTaskInsertionTimeAsc],
  ["task_insertion_time:desc", sortByTaskInsertionTimeDesc],
];

const sortMapper = new Map<SortKey, TaskSorter>(sortEntries);

export default sortMapper;
