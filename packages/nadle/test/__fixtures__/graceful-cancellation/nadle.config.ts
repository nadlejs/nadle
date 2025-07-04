import { tasks } from "nadle";

tasks.register("success-task", async () => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
});
tasks.register("fail-task", () => {
	throw new Error("This task is expected to fail");
});
tasks.register("main-task").config({ dependsOn: ["fail-task", "success-task"] });
