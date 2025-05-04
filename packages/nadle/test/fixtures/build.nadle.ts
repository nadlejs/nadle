import { tasks, type TaskFn } from "../../lib/index.js";

tasks.register("hello", async () => {
	await new Promise((r) => setTimeout(r, 100));
	console.log("Hello from nadle!");
});

tasks.register("goodbye", () => {
	console.log("Goodbye, tak!");
});

function copyTask(): TaskFn {
	return async (context) => {
		const { to, from } = context.options;
		console.log(`Copying from ${from} to ${to}`);
	};
}

tasks.register("copy", copyTask()).meta((context) => {
	context.configure({
		meta: {
			dependsOn: ["prepare"]
		},
		options: {
			to: "dist/",
			from: "assets/"
		}
	});
});

tasks.register("prepare", async () => {
	console.log("Preparing...");
});
