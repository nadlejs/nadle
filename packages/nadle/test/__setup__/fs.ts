import Path from "node:path";
import Fs from "node:fs/promises";

import fixturify from "fixturify";

import { randomHash } from "./random.js";
import { type Exec, createExec } from "./exec.js";
import { tempDir, fixturesDir, defaultConfigFile } from "./constants.js";

const TEMP_DIR = "__temp__";

export async function withFixture(params: {
	preserve?: boolean;
	configName: string;
	files: fixturify.DirJSON;
	testFn: (params: { exec: Exec; cwd: string; getFiles: () => fixturify.DirJSON }) => Promise<void>;
}) {
	const { files, testFn, configName, preserve = false } = params;
	const cwd = Path.join(Path.join(fixturesDir, configName, TEMP_DIR, randomHash()));

	await Fs.mkdir(cwd, { recursive: true });
	await Fs.copyFile(Path.join(fixturesDir, configName, defaultConfigFile), Path.join(cwd, defaultConfigFile));

	fixturify.writeSync(cwd, files);

	const getFiles = () => fixturify.readSync(cwd, { ignore: [defaultConfigFile] });

	try {
		await testFn({ cwd, getFiles, exec: createExec({ cwd }) });

		if (!preserve) {
			await Fs.rm(cwd, { force: true, recursive: true });
		}
	} catch (err) {
		console.warn(`⚠️  Test failed — fixture preserved at: ${cwd}`);
		throw err;
	}
}

export async function withTemp(params: { preserve?: boolean; testFn: (params: { cwd: string }) => Promise<void> }) {
	const { testFn, preserve = false } = params;
	const cwd = Path.join(tempDir, randomHash());
	await Fs.mkdir(cwd, { recursive: true });

	try {
		await testFn({ cwd });

		if (!preserve) {
			await Fs.rm(cwd, { force: true, recursive: true });
		}
	} catch (err) {
		console.warn(`⚠️  Test failed — files preserved at: ${cwd}`);
		throw err;
	}
}
