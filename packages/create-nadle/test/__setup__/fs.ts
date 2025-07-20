import Path from "node:path";
import Fs from "node:fs/promises";

import fixturify from "fixturify";

import { randomHash } from "./random.js";
import { fixturesDir, CONFIG_FILE } from "./constants.js";

type Awaitable<T> = T | PromiseLike<T>;

const TEMP_DIR = "__temp__";

async function isPathExists(path: string): Promise<boolean> {
	try {
		await Fs.access(path);

		return true;
	} catch {
		return false;
	}
}

export async function withFixture(params: {
	preserve?: boolean;
	fixtureDir: string;
	ignoreFiles?: string[];
	files: fixturify.DirJSON;
	testFn: (params: { cwd: string; getFiles: () => fixturify.DirJSON }) => Awaitable<void>;
}) {
	const { files, testFn, fixtureDir, preserve = false, ignoreFiles = [CONFIG_FILE, "package.json"] } = params;
	const cwd = Path.join(Path.join(fixturesDir, fixtureDir, TEMP_DIR, randomHash()));

	await Fs.mkdir(cwd, { recursive: true });

	const configFilePath = Path.join(fixturesDir, fixtureDir, CONFIG_FILE);

	if (await isPathExists(configFilePath)) {
		await Fs.copyFile(configFilePath, Path.join(cwd, CONFIG_FILE));
	}

	const packageJsonPath = Path.join(fixturesDir, fixtureDir, "package.json");

	if (await isPathExists(packageJsonPath)) {
		await Fs.copyFile(packageJsonPath, Path.join(cwd, "package.json"));
	}

	fixturify.writeSync(cwd, files);

	const getFiles = () => fixturify.readSync(cwd, { ignore: ignoreFiles });

	try {
		await testFn({ cwd, getFiles });

		if (!preserve) {
			await Fs.rm(cwd, { force: true, recursive: true });
		}
	} catch (err) {
		console.warn(`⚠️  Test failed — fixture preserved at: ${cwd}`);
		throw err;
	}
}
