import Path from "node:path";

import fg from "fast-glob";

import { hashFile } from "../utils.js";
import type { FileFingerprints } from "./fingerprint.js";

export interface FileDeclaration {
	readonly type: "file";
	readonly patterns: string[];
}

export interface DirDeclaration {
	readonly type: "dir";
	readonly patterns: string[];
}

export type Declaration = FileDeclaration | DirDeclaration;

/** @internal */
export namespace Declaration {
	export async function computeFileFingerprints(params: {
		files?: string[];
		workingDir: string;
		declarations: Declaration[];
	}): Promise<FileFingerprints> {
		const { files, workingDir, declarations } = params;
		const fingerprint: FileFingerprints = {};

		for (const declaration of declarations) {
			const paths = await resolveDeclaration(workingDir, declaration);

			await Promise.all(
				paths.map(async (path) => {
					fingerprint[path] = await hashFile(path);
				})
			);
		}

		await Promise.all(files?.map(async (path) => (fingerprint[path] = await hashFile(path))) ?? []);

		return fingerprint;
	}

	async function resolveDeclaration(workingDir: string, declaration: Declaration): Promise<string[]> {
		if (declaration.type === "file") {
			const paths: string[] = [];

			for (const pattern of declaration.patterns) {
				if (!fg.isDynamicPattern(pattern)) {
					paths.push(Path.resolve(workingDir, pattern));
					continue;
				}

				paths.push(...(await fg(pattern, { absolute: true, cwd: workingDir, onlyFiles: true })));
			}

			return paths;
		}

		if (declaration.type === "dir") {
			const paths: string[] = [];

			for (const pattern of declaration.patterns) {
				if (!fg.isDynamicPattern(pattern)) {
					paths.push(...(await fg(`${pattern}/**/*`, { absolute: true, cwd: workingDir, onlyFiles: true })));
					continue;
				}

				const matchedDirs = await fg(pattern, { absolute: true, cwd: workingDir, onlyDirectories: true });

				for (const dir of matchedDirs) {
					paths.push(...(await fg(`${dir}/**/*`, { absolute: true, onlyFiles: true })));
				}
			}

			return paths;
		}

		throw new Error(`Unknown input declaration: ${JSON.stringify(declaration)}`);
	}
}
