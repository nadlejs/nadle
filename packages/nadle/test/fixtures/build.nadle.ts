import { task, type TaskFn } from "../../lib/index.js";

task("hello", async () => {
	await new Promise((r) => setTimeout(r, 100));
	console.log("Hello from nadle!");
});

task("goodbye", () => {
	console.log("Goodbye, tak!");
});

function copyTask(): TaskFn {
	return async (context) => {
		const { to, from } = context.options;
		console.log(`Copying from ${from} to ${to}`);
	};
}

task("copy", copyTask()).meta((context) => {
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

task("prepare", async () => {
	console.log("Preparing...");
});
