import Url from "node:url";

import { createJiti } from "jiti";
import { SUPPORT_EXTENSIONS } from "@nadle/project-resolver";

import { type FileReader } from "../file-reader.js";
import { Messages } from "../../utilities/messages.js";
import { NadleError, ConfigurationError } from "../../utilities/nadle-error.js";

export class DefaultFileReader implements FileReader {
	private readonly reader = createJiti(import.meta.url, {
		interopDefault: true,
		extensions: SUPPORT_EXTENSIONS.map((ext) => `.${ext}`)
	});

	public async read(filePath: string) {
		try {
			await this.reader.import(Url.pathToFileURL(filePath).toString());
		} catch (error) {
			if (error instanceof NadleError) {
				throw error;
			}

			throw new ConfigurationError(Messages.ConfigFileLoadFailed(filePath, error instanceof Error ? error.message : String(error)));
		}
	}
}
