import Path from "node:path";
import Fs from "node:fs/promises";

import { tasks, Inputs, Outputs } from "nadle";

async function bundle(workingDir: string, name: string) {
	const content = await Fs.readFile(Path.join(workingDir, "input.txt"), "utf-8");

	const outputPath = Path.join(workingDir, `dist-${name}`, "output.txt");
	await Fs.mkdir(Path.dirname(outputPath), { recursive: true });
	await Fs.writeFile(outputPath, `${content} -- ${name}`);
}

tasks.register("failing", () => {
	throw new Error("boom");
});

// Independent of the failure: under --continue it still runs and must cache normally.
tasks.register("cacheable", {
	inputs: [Inputs.files("input.txt")],
	outputs: [Outputs.dirs("dist-cacheable")],
	run: ({ context }) => bundle(context.workingDir, "cacheable")
});

// Blocked by the failure: it never runs, so it must never be recorded as cached.
tasks.register("blockedCacheable", {
	dependsOn: ["failing"],
	inputs: [Inputs.files("input.txt")],
	outputs: [Outputs.dirs("dist-blocked")],
	run: ({ context }) => bundle(context.workingDir, "blocked")
});
