import Fs from "node:fs/promises";

import { tasks } from "nadle";

tasks
	.register("bundle-resources-a", async () => {
		await Fs.cp("resources/a", "dist", { recursive: true });
	})
	.config({ inputs: ["resources/a/**/a?-input.txt"] });

tasks
	.register("bundle-resources-b", async () => {
		await Fs.cp("resources", "dist", { recursive: true });
	})
	.config({ outputs: ["dist/**/??*-input.txt"] });

tasks
	.register("bundle-resources", async () => {
		await Fs.cp("resources", "dist", { recursive: true });
	})
	.config({ outputs: ["dist"], inputs: ["resources"] });
