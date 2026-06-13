import Fs from "node:fs/promises";

import { use, tasks, definePlugin } from "nadle";

const plugin = definePlugin({
	name: "marker",
	hooks: {
		afterAll: async () => Fs.appendFile("hooks.log", "afterAll\n"),
		beforeAll: async () => Fs.appendFile("hooks.log", "beforeAll\n"),
		beforeTask: async (ctx) => Fs.appendFile("hooks.log", `beforeTask:${ctx.task.name}\n`),
		afterTask: async (ctx) => Fs.appendFile("hooks.log", `afterTask:${ctx.task.name}:${ctx.result}\n`)
	}
});

use(plugin);

tasks.register("hello", () => {});
