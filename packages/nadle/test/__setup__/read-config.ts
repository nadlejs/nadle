import Path from "node:path";
import Fs from "node:fs/promises";

const configsDir = Path.resolve(import.meta.dirname, "..", "__configs__");

export async function readConfig(name: string): Promise<string> {
	return Fs.readFile(Path.join(configsDir, name), "utf-8");
}
