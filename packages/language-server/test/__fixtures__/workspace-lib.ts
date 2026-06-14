// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

tasks.register("compile", {
	run: ExecTask,
	options: { command: "tsc" },
	description: "Compile the library"
});

tasks.register("lint", { run: ExecTask, options: { command: "eslint" } });
