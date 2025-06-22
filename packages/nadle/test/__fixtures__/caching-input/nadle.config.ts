import Path from "node:path";
import Fs from "node:fs/promises";

import { glob } from "glob";
import { tasks, Inputs, Outputs } from "nadle";

tasks
	.register("bundle-resources", async ({ context }) => {
		for (const entry of await glob("resources/**/*.txt", {})) {
			const path = Path.join(context.workingDir, entry);
			const content = await Fs.readFile(path, "utf-8");
			const modifiedContent = content + " modified";

			const outputPath = Path.join(context.workingDir, "dist", entry);
			await Fs.mkdir(Path.dirname(outputPath), { recursive: true });
			await Fs.writeFile(outputPath, modifiedContent);
		}
	})
	.config({ outputs: [Outputs.dirs("dist")], inputs: [Inputs.files("resources/{a1,a2}-input.txt")] });
