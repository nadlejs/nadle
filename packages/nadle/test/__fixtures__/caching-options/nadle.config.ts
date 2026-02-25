import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs } from "nadle";

interface CompileOptions {
	mode: string;
}

const compileTask = {
	run: async ({ options, context }: { options: CompileOptions; context: { workingDir: string } }) => {
		const inputPath = Path.join(context.workingDir, "src", "input.txt");
		const content = await Fs.readFile(inputPath, "utf-8");

		const outputDir = Path.join(context.workingDir, "dist");
		await Fs.mkdir(outputDir, { recursive: true });
		await Fs.writeFile(Path.join(outputDir, "output.txt"), `${content} [${options.mode}]`);
	}
};

tasks
	.register("compile", compileTask, () => ({ mode: process.env.BUILD_MODE ?? "development" }))
	.config({ inputs: [Inputs.dirs("src")], outputs: [Outputs.dirs("dist")] });
