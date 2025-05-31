import { tasks, type Task } from "nadle";

tasks.register("firstTask", () => console.log(process.env)).config({ env: { FIRST_TASK_ENV: "first task env" } });

const MyTask: Task = {
	run: () => console.log(process.env)
};

tasks.register("secondTask", MyTask, {}).config(() => ({ env: { SECOND_TASK_ENV: "second task env" } }));
