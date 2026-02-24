// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

tasks.register("compile", ExecTask, { command: "tsc" }).config({
	description: "Compile the library"
});

tasks.register("lint", ExecTask, { command: "eslint" });
