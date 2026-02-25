import { Declaration } from "./declaration.js";
import { hashFile } from "../../utilities/hash.js";

export type FileFingerprints = {
	[filePath: string]: string;
};

export namespace FileFingerprints {
	/**
	 * Compute fingerprints (hashes) for all files matched by the given declarations and additional files.
	 *
	 * Declarations are resolved concurrently and file paths are deduplicated before hashing.
	 */
	export async function compute(params: { files?: string[]; workingDir: string; declarations: Declaration[] }): Promise<FileFingerprints> {
		const { files, workingDir, declarations } = params;

		const resolvedPaths = await Promise.all(declarations.map((d) => Declaration.resolve(d, workingDir)));
		const allPaths = [...new Set([...resolvedPaths.flat(), ...(files ?? [])])];

		const fingerprint: FileFingerprints = {};
		await Promise.all(allPaths.map(async (path) => (fingerprint[path] = await hashFile(path))));

		return fingerprint;
	}
}
