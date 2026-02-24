import Fs from "node:fs/promises";

export async function readJson<T = unknown>(path: string): Promise<T> {
	try {
		const data = await Fs.readFile(path, "utf8");

		return JSON.parse(data) as T;
	} catch (e) {
		throw new Error(`Failed to read JSON from ${path}: ${(e as Error).message}`);
	}
}

export async function isPathExists(path: string): Promise<boolean> {
	try {
		await Fs.access(path);

		return true;
	} catch {
		return false;
	}
}
