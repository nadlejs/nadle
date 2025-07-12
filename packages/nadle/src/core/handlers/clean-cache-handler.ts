import Fs from "node:fs/promises";

import { BaseHandler } from "./base-handler.js";

export class CleanCacheHandler extends BaseHandler {
	public readonly name = "clean-cache";
	public readonly description = "Cleans the cache directory.";

	public canHandle(): boolean {
		return this.nadle.options.cleanCache;
	}

	public async handle() {
		try {
			this.nadle.logger.log(`Cleaning cache at ${this.nadle.options.cacheDir}...`);
			await Fs.rm(this.nadle.options.cacheDir, { force: true, recursive: true });
		} catch (error) {
			this.nadle.logger.error(`Failed to clean cache at ${this.nadle.options.cacheDir}:`, error);
			throw error;
		}
	}
}
