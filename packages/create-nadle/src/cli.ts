/* eslint-disable no-console */
import Path from "node:path";
import Fs from "node:fs/promises";
import Process from "node:process";

import { execa } from "execa";
import Prefer from "preferred-pm";

async function main() {
	const pm = (await Prefer(Process.cwd())) || { name: "npm" };
	console.log(`✓ Detected package manager ${pm.name}`);

	const args =
		pm.name === "pnpm"
			? ["install", "nadle", "-D"]
			: pm.name === "yarn"
				? ["add", "nadle", "-D", "-W"]
				: ["install", "nadle", "--save-dev", "--include-workspace-root"];

	// Install nadle
	await execa(pm.name, args, { stdio: "inherit" });

	await Fs.writeFile(
		Path.join(Process.cwd(), "nadle.config.ts"),
		`import { tasks } from "nadle";

tasks.register("build", () => {
  console.log("Building project...");
});
`
	);

	console.log(`✓ Wrote nadle.config.ts to ${Path.join(Process.cwd(), "nadle.config.ts")}...`);
	console.log("✓ Project ready!");
}

main().catch((err) => {
	console.error("× Failed to create project:", err);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
