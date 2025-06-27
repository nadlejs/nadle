import Crypto from "node:crypto";
import Fs from "node:fs/promises";

import objectHash from "object-hash";

export function hashObject(object: object): string {
	return objectHash(object, { encoding: "hex", algorithm: "sha256", unorderedArrays: true, unorderedObjects: true });
}

export async function hashFile(filePath: string): Promise<string> {
	const content = await Fs.readFile(filePath);

	return Crypto.createHash("sha256").update(content).digest("hex");
}
