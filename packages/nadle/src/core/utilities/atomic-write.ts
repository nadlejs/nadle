import Fs from "node:fs/promises";

export async function atomicWriteFile(filePath: string, content: string): Promise<void> {
	const tmpPath = filePath + ".tmp";

	await Fs.writeFile(tmpPath, content);
	await Fs.rename(tmpPath, filePath);
}
