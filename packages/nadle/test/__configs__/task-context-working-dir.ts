import { tasks } from "nadle";

tasks.register("withConfiguredWorkingDir", {
	workingDir: "src/test",
	run: ({ context }) => {
		console.log(`Hello from ${context.workingDir}`);
	}
});

tasks.register("withoutWorkingDir", ({ context }) => {
	console.log(`Hello from ${context.workingDir}`);
});
