import { tasks, type Task } from "../../lib/index.js";

tasks
	.register("hello", async () => {
		await new Promise((r) => setTimeout(r, 100));
		console.log("Hello from nadle!");
	})
	.config({ group: "Greetings", description: "Say hello to nadle!" });

tasks
	.register("goodbye", () => {
		console.log("Goodbye, tak!");
	})
	.config({ group: "Greetings", description: "Say goodbye to nadle!" });

interface CopyOptions {
	to: string;
	from: string;
}

const CopyTask: Task<CopyOptions> = {
	run: ({ options }) => {
		const { to, from } = options;
		console.log(`Copying from ${from} to ${to}`);
	}
};
tasks.register("copy", CopyTask, { to: "dist/", from: "assets/" }).config({
	group: "Utils",
	dependsOn: ["prepare"]
});

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

tasks
	.register("throwable", () => {
		throw new Error("This is an error");
	})
	.config({ dependsOn: ["prepare", "hello"] });
