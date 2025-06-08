import Path from "node:path";
import { pathToFileURL } from "node:url";

import { createJiti } from "jiti";

import { registry } from "./registry.js";

export class Loader {
	async main() {
		const jiti = createJiti(import.meta.url, {
			fsCache: true,
			interopDefault: true
		});

		await jiti.import(pathToFileURL(Path.join(import.meta.dirname, "config.ts")).toString());

		console.log(registry.getAll());
	}
}
