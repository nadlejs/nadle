import Fs from "node:fs/promises";

export async function isFileExists(filePath: string): Promise<boolean> {
	try {
		await Fs.access(filePath);

		return true;
	} catch {
		return false;
	}
}
