import Url from "node:url";

import { createJiti } from "jiti";
import { SUPPORT_EXTENSIONS } from "@nadle/project-resolver";

import { type FileReader } from "../file-reader.js";

export class DefaultFileReader implements FileReader {
	private readonly reader = createJiti(import.meta.url, {
		interopDefault: true,
		extensions: SUPPORT_EXTENSIONS.map((ext) => `.${ext}`)
	});

	public async read(filePath: string) {
		await this.reader.import(Url.pathToFileURL(filePath).toString());
	}
}
