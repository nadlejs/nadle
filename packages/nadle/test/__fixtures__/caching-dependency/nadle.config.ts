import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs } from "nadle";

tasks.register("compile-a", {
	inputs: [Inputs.dirs("src-a")],
	outputs: [Outputs.dirs("dist-a")],
	run: async ({ context }) => {
		const inputPath = Path.join(context.workingDir, "src-a", "input.txt");
		const content = await Fs.readFile(inputPath, "utf-8");

		const outputDir = Path.join(context.workingDir, "dist-a");
		await Fs.mkdir(outputDir, { recursive: true });
		await Fs.writeFile(Path.join(outputDir, "output.txt"), content + " compiled");
	}
});

tasks.register("compile-b", {
	dependsOn: ["compile-a"],
	inputs: [Inputs.dirs("src-b")],
	outputs: [Outputs.dirs("dist-b")],
	run: async ({ context }) => {
		const inputPath = Path.join(context.workingDir, "src-b", "input.txt");
		const content = await Fs.readFile(inputPath, "utf-8");

		const outputDir = Path.join(context.workingDir, "dist-b");
		await Fs.mkdir(outputDir, { recursive: true });
		await Fs.writeFile(Path.join(outputDir, "output.txt"), content + " compiled");
	}
});
