import Path from "node:path";
import Fs from "node:fs/promises";

import { glob } from "glob";

import { type FileDeclarations } from "./file-declarations.js";

export type FileSet = string[];
export namespace FileSet {
	const collator = new Intl.Collator("en", { sensitivity: "base" });

	export async function resolve(workingDir: string, declarations: FileDeclarations | undefined): Promise<FileSet> {
		const normalizedDeclarations = await Promise.all((declarations ?? []).map((declaration) => normalizeToGlob(workingDir, declaration)));

		const files = await glob(normalizedDeclarations, { nodir: true, absolute: true, cwd: workingDir });

		return files.sort(collator.compare);
	}

	async function normalizeToGlob(workingDir: string, path: string): Promise<string> {
		const fullPath = Path.resolve(workingDir, path);

		try {
			const stats = await Fs.stat(fullPath);

			if (stats.isDirectory()) {
				return Path.join(path, "**/*");
			}
		} catch {
			// File doesn't exist or is a glob pattern — return as-is
		}

		return path;
	}
}
