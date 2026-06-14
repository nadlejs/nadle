import { tasks, Inputs, Outputs, ExecTask } from "nadle";

tasks.register("compile", {
	run: ExecTask,
	options: { command: "tsc", args: ["--build"] },
	outputs: [Outputs.dirs("lib")],
	inputs: [Inputs.files("src/**/*.ts")]
});
