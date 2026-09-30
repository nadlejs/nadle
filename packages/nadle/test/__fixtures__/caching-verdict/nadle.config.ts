import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs } from "nadle";

// Appends a line per execution so a test can count how many times the body ran.
async function recordRun(workingDir: string, name: string) {
	await Fs.appendFile(Path.join(workingDir, `${name}.runs`), "run\n");
}

tasks.register("lint", {
	cacheVerdict: true,
	inputs: [Inputs.dirs("sources")],
	run: async ({ context }) => {
		await recordRun(context.workingDir, "lint");
	}
});

tasks.register("failing-lint", {
	cacheVerdict: true,
	inputs: [Inputs.dirs("sources")],
	run: async ({ context }) => {
		await recordRun(context.workingDir, "failing-lint");
		throw new Error("lint found problems");
	}
});

tasks.register("uncached-lint", {
	inputs: [Inputs.dirs("sources")],
	run: async ({ context }) => {
		await recordRun(context.workingDir, "uncached-lint");
	}
});
