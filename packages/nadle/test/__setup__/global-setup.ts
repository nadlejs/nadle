import Path from "node:path";
import Fs from "node:fs/promises";

const TEMP_DIR = "__temp__";

// Clean up __temp__ directories from previous test runs on startup.
// These accumulate from preserved fixtures of failed tests.
export default async function globalSetup() {
	const rootPackage = Path.resolve(import.meta.dirname, "..", "..");
	const fixturesDir = Path.resolve(rootPackage, "test", "__fixtures__");
	const globalTempDir = Path.resolve(rootPackage, "test", TEMP_DIR);

	const removals: Promise<void>[] = [];

	// Remove the global __temp__ directory
	removals.push(Fs.rm(globalTempDir, { force: true, recursive: true }));

	// Remove per-fixture __temp__ directories
	for (const entry of await Fs.readdir(fixturesDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue;
		}

		const fixtureTempDir = Path.join(fixturesDir, entry.name, TEMP_DIR);
		removals.push(Fs.rm(fixtureTempDir, { force: true, recursive: true }));
	}

	await Promise.all(removals);
}
