import Fs from "node:fs/promises";

import { tasks } from "nadle";

tasks
	.register("bundle-resources", async () => {
		await Fs.cp("resources", "dist", { recursive: true });
	})
	.config({ outputs: ["dist"], inputs: ["resources"] });
