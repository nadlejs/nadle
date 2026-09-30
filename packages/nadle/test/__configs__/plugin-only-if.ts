import Fs from "node:fs/promises";

import { use, tasks, definePlugin } from "nadle";

const plugin = definePlugin({
	name: "marker",
	hooks: {
		beforeTask: async (ctx) => Fs.appendFile("hooks.log", `beforeTask:${ctx.task.name}\n`),
		afterTask: async (ctx) => Fs.appendFile("hooks.log", `afterTask:${ctx.task.name}:${ctx.result}\n`)
	}
});

use(plugin);

tasks.register("guarded", { run: () => {}, onlyIf: () => false });
