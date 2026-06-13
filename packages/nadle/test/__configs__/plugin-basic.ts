import Fs from "node:fs/promises";

import { use, tasks, definePlugin } from "nadle";

const plugin = definePlugin({
	name: "marker",
	hooks: {
		afterAll: async () => Fs.appendFile("hooks.log", "afterAll\n"),
		beforeAll: async () => Fs.appendFile("hooks.log", "beforeAll\n")
	}
});

use(plugin);

tasks.register("hello", () => {});
