import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs } from "nadle";

tasks
	.register("build", async () => {
		const content = await Fs.readFile("input.txt", "utf-8");
		const modifiedContent = content + " modified";

		await Fs.mkdir("dist", { recursive: true });
		await Fs.writeFile(Path.join("dist", "output.txt"), modifiedContent);
	})
	.config({ outputs: [Outputs.dirs("dist")], inputs: [Inputs.files("input.txt")] });
