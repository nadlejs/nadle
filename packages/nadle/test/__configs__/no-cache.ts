import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs } from "nadle";

tasks
	.register("bundle", async ({ context }) => {
		const content = await Fs.readFile(Path.join(context.workingDir, "input.txt"), "utf-8");

		const outputPath = Path.join(context.workingDir, "dist", "output.txt");
		await Fs.mkdir(Path.dirname(outputPath), { recursive: true });
		await Fs.writeFile(outputPath, `${content} -- modified`);
	})
	.config({ outputs: [Outputs.dirs("dist")], inputs: [Inputs.files("input.txt")] });
