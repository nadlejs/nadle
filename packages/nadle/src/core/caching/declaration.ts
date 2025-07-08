import Path from "node:path";

import fg from "fast-glob";

import { hashFile } from "../utilities/hash.js";
import type { FileFingerprints } from "./fingerprint.js";

/**
 * Declaration for file input/output patterns.
 */
export interface FileDeclaration {
	/** The declaration type, always "file". */
	readonly type: "file";
	/** Glob patterns or paths matching files. */
	readonly patterns: string[];
}

/**
 * Declaration for directory input/output patterns.
 */
export interface DirDeclaration {
	/** The declaration type, always "dir". */
	readonly type: "dir";
	/** Glob patterns or paths matching directories. */
	readonly patterns: string[];
}

/**
 * Union type for file or directory declarations.
 */
export type Declaration = FileDeclaration | DirDeclaration;

/**
 * @internal
 * Namespace for declaration utilities.
 */
export namespace Declaration {
	/**
	 * Compute fingerprints (hashes) for all files matched by the given declarations and additional files.
	 *
	 * @param params - Parameters for fingerprint computation.
	 * @param params.files - Additional file paths to fingerprint.
	 * @param params.workingDir - The working directory for resolving patterns.
	 * @param params.declarations - List of file/dir declarations.
	 * @returns A promise resolving to a map of file paths to their fingerprints.
	 */
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

	/**
	 * Resolve a declaration to a list of absolute file paths.
	 *
	 * @param workingDir - The working directory for resolving patterns.
	 * @param declaration - The file or directory declaration.
	 * @returns A promise resolving to a list of absolute file paths.
	 * @internal
	 */
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
