# TODO App

## Features Targeted

- Storing a list of tasks and/or todos
- Adding a task to a todo
- Adding a new todo
- Modifying the status of a task
- Deleting a task and/or todo
- Adding priorities to a task (important/not important && urgent/not urgent)
- Scheduling a task
- Sorting tasks

## Methods and Paths

| HTTP Method | Path                                         | Purpose                           | Response Status Codes | Request Headers | Response Headers                | Response Content                                                                                                             |
| ----------- | -------------------------------------------- | --------------------------------- | --------------------- | --------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET         | /todo/todos                                  | To get all todos in json          | 200                   |                 | `Content-type:application/json` | `[{todo_Id:<todo-id>, title:<todo-title>, tasks:[{task_Id:<task-id>, description:<task-description>, done:<task-status>}]}]` |
| GET         | /todo/todos/{todo-id}                        | To get todo of given id           | 200                   |                 | `Content-type:application/json` | `{todo_Id:<todo-id>, title:<todo-title>, tasks:[{task_Id:<task-id>, description:<task-description>, done:<task-status>}]}`   |
| POST        | /todo/todos                                  | To create a new todo              | 201                   |                 | `Content-type:application/json` | `{todo_Id:<todo-id>, title:<todo-title>, tasks:[]}`                                                                          |
| POST        | /todo/todos/{todo-id}/tasks                  | To create a new task in a todo    | 201                   |                 | `Content-type:application/json` | `{task_Id:<task-id>, description:<task-description>, done:<task-status>}`                                                    |
| PUT         | /todo/todos/{todo-id}/tasks/{task-id}/status | To toggle a task status in a todo | 200                   |                 | `Content-type:application/json` | `{task_Id:<task-id>, description:<task-description>, done:<task-status>}`                                                    |
| DELETE      | /todo/todos/{todo-id}/tasks/{task-id}        | To delete a task in a todo        | 204                   |                 |                                 |                                                                                                                              |
| DELETE      | /todo/todos/{todo-id}                        | To delete a todo                  | 204                   |                 |                                 |                                                                                                                              |

## Directory Structure

```
.
├── README.md
├── TODO.md
├── main.ts
├── deno.json
├── deno.lock
├── setup.sh
├── .gitignore
├── .git-message
├── hooks
│   ├── pre-commit
│   └── pre-push
├── src
│   ├── handlers
│   ├── models
│   └── app.ts
└── test
    ├── handlers
    └── models
```
