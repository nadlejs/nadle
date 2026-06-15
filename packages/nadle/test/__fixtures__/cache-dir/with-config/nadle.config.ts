import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs, configure } from "nadle";

configure({
	cacheDir: ".nadle-custom-by-file"
});

tasks.register("build", {
	outputs: [Outputs.dirs("dist")],
	inputs: [Inputs.files("input.txt")],
	run: async () => {
		const content = await Fs.readFile("input.txt", "utf-8");
		const modifiedContent = content + " modified";

		await Fs.mkdir("dist", { recursive: true });
		await Fs.writeFile(Path.join("dist", "output.txt"), modifiedContent);
	}
});
