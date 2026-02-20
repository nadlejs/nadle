import Path from "node:path";
import Fs from "node:fs/promises";

import { expect } from "vitest";

import { serialize } from "./serialize.js";
import { toRun } from "./matchers/to-run.js";
import { toSettle } from "./matchers/to-settle.js";
import { toRunInOrder } from "./matchers/to-run-in-order.js";
import { toDoneInOrder } from "./matchers/to-done-in-order.js";
import { toThrowPlainMessage } from "./matchers/to-throw-plain-message.js";

expect.addSnapshotSerializer({ serialize, test: (val) => typeof val === "string" });

expect.extend({ toRun, toSettle, toRunInOrder, toDoneInOrder, toThrowPlainMessage });

// Ensure test fixtures have a node_modules/nadle symlink pointing to the local package.
// On CI (fresh checkout), these symlinks don't exist since node_modules is gitignored.
// Without them, fixture configs resolve "nadle" to the pkg.pr.new version in root
// node_modules, causing a dual-module problem (different AsyncLocalStorage instance).
const rootPackage = Path.resolve(import.meta.dirname, "..", "..");
const fixturesDir = Path.resolve(rootPackage, "test", "__fixtures__");

for (const entry of await Fs.readdir(fixturesDir, { withFileTypes: true })) {
	if (!entry.isDirectory()) {
		continue;
	}

	const dirs = [Path.join(fixturesDir, entry.name)];

	// Check subdirectories (e.g. cache-dir/with-config)
	for (const sub of await Fs.readdir(dirs[0], { withFileTypes: true })) {
		if (sub.isDirectory() && sub.name !== "node_modules" && sub.name !== "__temp__") {
			dirs.push(Path.join(dirs[0], sub.name));
		}
	}

	for (const dir of dirs) {
		const pkgJson = Path.join(dir, "package.json");

		try {
			await Fs.access(pkgJson);
		} catch {
			continue;
		}

		const symlinkPath = Path.join(dir, "node_modules", "nadle");

		try {
			await Fs.access(symlinkPath);
			continue;
		} catch {
			// Symlink doesn't exist, create it
		}

		await Fs.mkdir(Path.join(dir, "node_modules"), { recursive: true });
		await Fs.symlink(rootPackage, symlinkPath, "junction");
	}
}
