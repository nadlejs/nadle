import Url from "node:url";

import { createJiti } from "jiti";

import { SUPPORT_EXTENSIONS } from "./constants.js";

interface IFileReader {
	read(filePath: string): Promise<void>;
}

export class FileReader implements IFileReader {
	private readonly reader = createJiti(import.meta.url, {
		interopDefault: true,
		extensions: SUPPORT_EXTENSIONS.map((ext) => `.${ext}`)
	});

	public async read(filePath: string) {
		await this.reader.import(Url.pathToFileURL(filePath).toString());
	}
}
