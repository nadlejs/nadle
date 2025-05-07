import { tasks, type Task } from "nadle";

const CopyTask: Task<{ to: string; from: string }> = {
	run: ({ options }) => {
		const { to, from } = options;
		console.log(`Copying from ${from} to ${to}`);
	}
};

tasks.register("hello", async () => {
	await new Promise((r) => setTimeout(r, 300));
	console.log("Hello from nadle!");
});

tasks
	.register("goodbye", () => {
		console.log("Goodbye, tak!");
	})
	.config({ dependsOn: ["hello"] });

tasks.register("copy", CopyTask, { to: "dist/", from: "assets/" }).config({ dependsOn: ["prepare"] });

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

tasks.register("node", async () => {
	console.log("Setup node...");
});

tasks
	.register("install", async () => {
		console.log("Installing npm...");
	})
	.config({ dependsOn: ["node"] });

tasks
	.register("compileTs", () => {
		console.log("Compiling ts...");
	})
	.config({ dependsOn: ["install"] });

tasks.register("compileSvg", () => {
	console.log("Compiling svg...");
});

tasks
	.register("compile", () => {
		console.log("Compiling...");
	})
	.config({ dependsOn: ["compileSvg", "compileTs"] });

tasks
	.register("test", () => {
		console.log("Running tests...");
	})
	.config({ dependsOn: ["compile"] });

tasks
	.register("build", () => {
		console.log("Building...");
	})
	.config({ dependsOn: ["test", "compile"] });
