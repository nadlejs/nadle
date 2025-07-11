import { Declaration } from "./declaration.js";
import { hashFile } from "../../utilities/hash.js";

export type FileFingerprints = {
	[filePath: string]: string;
};

export namespace FileFingerprints {
	/**
	 * Compute fingerprints (hashes) for all files matched by the given declarations and additional files.
	 *
	 * @param params - Parameters for fingerprint computation.
	 * @param params.files - Additional file paths to fingerprint.
	 * @param params.workingDir - The working directory for resolving patterns.
	 * @param params.declarations - List of file/dir declarations.
	 * @returns A promise resolving to a map of file paths to their fingerprints.
	 */
	export async function compute(params: { files?: string[]; workingDir: string; declarations: Declaration[] }): Promise<FileFingerprints> {
		const { files, workingDir, declarations } = params;
		const fingerprint: FileFingerprints = {};

		for (const declaration of declarations) {
			const paths = await Declaration.resolve(declaration, workingDir);

			await Promise.all(
				paths.map(async (path) => {
					fingerprint[path] = await hashFile(path);
				})
			);
		}

		await Promise.all(files?.map(async (path) => (fingerprint[path] = await hashFile(path))) ?? []);

		return fingerprint;
	}
}
