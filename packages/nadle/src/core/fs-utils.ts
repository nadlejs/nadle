import FsSync from "node:fs";
import Fs from "node:fs/promises";

export async function isPathExists(path: string): Promise<boolean> {
	try {
		await Fs.access(path);

		return true;
	} catch {
		return false;
	}
}

export function isPathExistsSync(path: string): boolean {
	try {
		FsSync.accessSync(path);

		return true;
	} catch {
		return false;
	}
}
