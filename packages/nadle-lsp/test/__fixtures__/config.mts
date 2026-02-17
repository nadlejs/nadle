// eslint-disable-next-line n/no-extraneous-import
import { tasks, Inputs, Outputs, ExecTask } from "nadle";

tasks.register("compile", ExecTask, { command: "tsc", args: ["--build"] }).config({
	outputs: [Outputs.dirs("lib")],
	inputs: [Inputs.files("src/**/*.ts")]
});
