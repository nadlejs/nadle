import { tasks } from "nadle";

tasks
	.register("withConfiguredWorkingDir", ({ context }) => {
		console.log(`Hello from ${context.workingDir}`);
	})
	.config({ workingDir: "src/test" });

tasks.register("withoutWorkingDir", ({ context }) => {
	console.log(`Hello from ${context.workingDir}`);
});
