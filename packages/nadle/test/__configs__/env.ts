import { lazy, tasks, type Task } from "nadle";

tasks.register("firstTask", { env: { FIRST_TASK_ENV: "first task env" }, run: () => console.log({ FIRST_TASK_ENV: process.env.FIRST_TASK_ENV }) });

const MyTask: Task = {
	run: () => {
		const { FIRST_TASK_ENV, SECOND_TASK_ENV } = process.env;
		console.log({ FIRST_TASK_ENV, SECOND_TASK_ENV });
	}
};

tasks.register(
	"secondTask",
	lazy(() => ({ run: MyTask, env: { SECOND_TASK_ENV: "second task env" } }))
);
