import { tasks, ExecTask, Inputs, Outputs } from "nadle";

tasks.register("compile", ExecTask, { command: "tsc", args: ["--build"] }).config({
	inputs: [Inputs.files("src/**/*.ts")],
	outputs: [Outputs.dirs("lib")]
});
