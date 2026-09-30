// @ts-nocheck -- LSP fixture; analyzed as AST, not compiled
import { tasks, Inputs, Outputs, ExecTask } from "nadle";

tasks.register("compile", {
	run: ExecTask,
	outputs: [Outputs.dirs("lib")],
	inputs: [Inputs.files("src/**/*.ts")],
	options: { command: "tsc", args: ["--build"] }
});
