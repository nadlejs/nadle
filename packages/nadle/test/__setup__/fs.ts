import Path from "node:path";
import Fs from "node:fs/promises";

import fixturify from "fixturify";
import { type Awaitable } from "src/index.js";

import { randomHash } from "./random.js";
import { type Exec, createExec } from "./exec.js";
import { isPathExists } from "../../src/core/utilities/fs.js";
import { tempDir, fixturesDir, CONFIG_FILE } from "./constants.js";

const TEMP_DIR = "__temp__";

export async function withFixture(params: {
	copyAll?: boolean;
	preserve?: boolean;
	fixtureDir: string;
	ignoreFiles?: string[];
	files?: fixturify.DirJSON;
	testFn: (params: { exec: Exec; cwd: string; getFiles: () => fixturify.DirJSON }) => Awaitable<void>;
}) {
	const { files, testFn, fixtureDir, copyAll = false, preserve = false, ignoreFiles = [CONFIG_FILE, "package.json"] } = params;
	const sourceDir = Path.join(fixturesDir, fixtureDir);
	const cwd = copyAll ? Path.join(tempDir, randomHash()) : Path.join(sourceDir, TEMP_DIR, randomHash());

	await Fs.mkdir(cwd, { recursive: true });

	if (copyAll) {
		await Fs.cp(sourceDir, cwd, {
			recursive: true,
			filter: (source) => !source.includes(TEMP_DIR)
		});
	} else {
		const configFilePath = Path.join(sourceDir, CONFIG_FILE);

		if (await isPathExists(configFilePath)) {
			await Fs.copyFile(configFilePath, Path.join(cwd, CONFIG_FILE));
		}

		const packageJsonPath = Path.join(sourceDir, "package.json");

		if (await isPathExists(packageJsonPath)) {
			await Fs.copyFile(packageJsonPath, Path.join(cwd, "package.json"));
		}
	}

	if (files) {
		fixturify.writeSync(cwd, files);
	}

	const getFiles = () => fixturify.readSync(cwd, { ignore: ignoreFiles });

	try {
		await testFn({ cwd, getFiles, exec: createExec({ cwd }) });

		if (!preserve) {
			await Fs.rm(cwd, { force: true, recursive: true });
		}
	} catch (err) {
		console.warn(`⚠️  Test failed — fixture preserved at: file://${cwd}`);
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

type FileChange =
	| { type: "add"; path: string; content: string }
	| { path: string; type: "delete" }
	| { path: string; type: "modify"; newContent: string | ((currentContent: string) => string) };

type RevertFileChange = { path: string; type: "delete" } | { type: "add"; path: string; content: string };

export async function withGeneratedFixture(params: {
	preserve?: boolean;
	files: fixturify.DirJSON;
	testFn: (params: { exec: Exec; cwd: string }) => Awaitable<void>;
}) {
	const { files, testFn, preserve = false } = params;
	const cwd = Path.join(tempDir, randomHash());

	await Fs.mkdir(cwd, { recursive: true });
	fixturify.writeSync(cwd, files);

	const nodeModulesDir = Path.join(cwd, "node_modules");
	await Fs.mkdir(nodeModulesDir, { recursive: true });
	await Fs.symlink(Path.resolve(import.meta.dirname, "..", ".."), Path.join(nodeModulesDir, "nadle"), "junction");

	try {
		await testFn({ cwd, exec: createExec({ cwd }) });

		if (!preserve) {
			await Fs.rm(cwd, { force: true, recursive: true });
		}
	} catch (err) {
		console.warn(`⚠️  Test failed — fixture preserved at: file://${cwd}`);
		throw err;
	}
}

export function createFileModifier(baseDir: string) {
	let backups: RevertFileChange[] = [];

	async function apply(changes: FileChange[]) {
		for (const change of changes) {
			try {
				const path = Path.resolve(baseDir, change.path);

				switch (change.type) {
					case "add": {
						const originalExists = await isPathExists(path);

						if (originalExists) {
							throw new Error(`File already exists at ${path}. Cannot add new file.`);
						}

						backups.push({ path, type: "delete" });

						await Fs.mkdir(Path.dirname(path), { recursive: true });
						await Fs.writeFile(path, change.content);
						break;
					}

					case "delete": {
						const originalExists = await isPathExists(path);

						if (!originalExists) {
							throw new Error(`File does not exist at ${path}. Cannot delete.`);
						}

						backups.push({ path, type: "add", content: await Fs.readFile(path, "utf8") });

						await Fs.rm(path, { force: true });
						break;
					}

					case "modify": {
						const originalExists = await isPathExists(path);

						if (!originalExists) {
							throw new Error(`File does not exist at ${path}. Cannot modify.`);
						}

						const currentContent = await Fs.readFile(path, "utf8");

						backups.push({ path, type: "add", content: currentContent });

						await Fs.writeFile(path, typeof change.newContent === "string" ? change.newContent : change.newContent(currentContent));
						break;
					}
				}
			} catch (err) {
				throw new Error(`Failed to apply change to ${change.path}: ${err}`);
			}
		}
	}

	async function restore() {
		for (const backup of [...backups].reverse()) {
			if (backup.type === "delete") {
				await Fs.rm(backup.path, { force: true });
			} else if (backup.type === "add") {
				await Fs.mkdir(Path.dirname(backup.path), { recursive: true });
				await Fs.writeFile(backup.path, backup.content);
			} else {
				throw new Error(`Unknown backup: ${JSON.stringify(backup)}`);
			}
		}

		backups = [];
	}

	return { apply, restore };
}
