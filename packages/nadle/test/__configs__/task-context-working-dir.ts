import { tasks } from "nadle";

tasks.register("withConfiguredWorkingDir", { run: ({ context }) => {
		console.log(`Hello from ${context.workingDir}`);
	}, workingDir: "src/test" });

tasks.register("withoutWorkingDir", ({ context }) => {
	console.log(`Hello from ${context.workingDir}`);
});
