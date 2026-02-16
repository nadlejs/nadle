import Fs from "node:fs/promises";

import { BaseHandler } from "./base-handler.js";

export class CleanCacheHandler extends BaseHandler {
	public readonly name = "clean-cache";
	public readonly description = "Cleans the cache directory.";

	public canHandle(): boolean {
		return this.context.options.cleanCache;
	}

	public async handle() {
		try {
			this.context.logger.log(`Cleaning cache at ${this.context.options.cacheDir}...`);
			await Fs.rm(this.context.options.cacheDir, { force: true, recursive: true });
		} catch (error) {
			this.context.logger.error(`Failed to clean cache at ${this.context.options.cacheDir}:`, error);
			throw error;
		}
	}
}
