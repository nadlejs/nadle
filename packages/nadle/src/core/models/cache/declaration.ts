import Path from "node:path";

import fg from "fast-glob";

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

/** @internal */
export namespace Declaration {
	/**
	 * Resolve a declaration to a list of absolute file paths.
	 *
	 * @param declaration - The file or directory declaration.
	 * @param workingDir - The working directory for resolving patterns.
	 * @returns A promise resolving to a list of absolute file paths.
	 * @internal
	 */
	export async function resolve(declaration: Declaration, workingDir: string): Promise<string[]> {
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
