import Fs from "node:fs/promises";

export async function isPathExists(path: string): Promise<boolean> {
	try {
		await Fs.access(path);

		return true;
	} catch {
		return false;
	}
}
