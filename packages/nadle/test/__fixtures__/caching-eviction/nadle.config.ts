import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs } from "nadle";

tasks
	.register("process", async ({ context }) => {
		const inputPath = Path.join(context.workingDir, "src", "input.txt");
		const content = await Fs.readFile(inputPath, "utf-8");

		const outputDir = Path.join(context.workingDir, "dist");
		await Fs.mkdir(outputDir, { recursive: true });
		await Fs.writeFile(Path.join(outputDir, "output.txt"), content + " processed");
	})
	.config({
		maxCacheEntries: 2,
		inputs: [Inputs.dirs("src")],
		outputs: [Outputs.dirs("dist")]
	});
