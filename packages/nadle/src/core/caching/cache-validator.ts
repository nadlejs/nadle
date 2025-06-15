import { hashFiles } from "../utils.js";
import { FileSet } from "./file-set.js";
import { CacheKey } from "./cache-key.js";
import { RunCacheMetadata } from "./metadata.js";
import { CacheManager } from "./cache-manager.js";
import type { CacheQuery } from "./cache-query.js";
import { type TaskConfiguration } from "../types.js";
import { type CacheMissReason } from "./cache-miss-reason.js";

type CacheValidationResult =
	| { result: "not-cacheable" }
	| { result: "up-to-date" }
	| { cacheQuery: CacheQuery; result: "restore-from-cache" }
	| {
			result: "cache-miss";
			cacheQuery: CacheQuery;
			reasons: CacheMissReason[];
			inputHashes: Record<string, string>;
	  };

export class CacheValidator {
	private readonly cacheManager: CacheManager;

	constructor(
		private readonly taskName: string,
		private readonly taskConfiguration: TaskConfiguration,
		private readonly workingDir: string,
		readonly cacheDir: string
	) {
		this.cacheManager = new CacheManager(cacheDir);
	}

	async validate(): Promise<CacheValidationResult> {
		if (this.taskConfiguration.inputs === undefined || this.taskConfiguration.outputs === undefined) {
			return { result: "not-cacheable" };
		}

		const inputs = await FileSet.resolve(this.workingDir, this.taskConfiguration.inputs);
		const { cacheKey, inputHashes } = await CacheKey.compute({ inputs, taskName: this.taskName });
		const cacheQuery: CacheQuery = { cacheKey, taskName: this.taskName };

		const outputs = await FileSet.resolve(this.workingDir, this.taskConfiguration.outputs);
		const outputHashes = await hashFiles(outputs);

		const hasCache = await this.cacheManager.hasCache(cacheQuery);
		const latestRunMetadata = await this.cacheManager.readLatestRunMetadata(this.taskName);

		if (!hasCache) {
			return {
				cacheQuery,
				inputHashes,
				result: "cache-miss",
				reasons: latestRunMetadata ? this.diffInputs(latestRunMetadata.inputs, inputHashes) : [{ type: "no-previous-cache" }]
			};
		}

		if (latestRunMetadata === null) {
			throw new Error("Unable to read latest run metadata for task: " + this.taskName);
		}

		if (latestRunMetadata.cacheKey === cacheKey && this.areOutputsEqual(latestRunMetadata.outputs, outputHashes)) {
			return { result: "up-to-date" };
		}

		return { cacheQuery, result: "restore-from-cache" };
	}

	private areOutputsEqual(oldOutputs: Record<string, string>, currentOutputs: Record<string, string>): boolean {
		if (Object.keys(oldOutputs).length !== Object.keys(currentOutputs).length) {
			return false;
		}

		for (const [file, hash] of Object.entries(oldOutputs)) {
			if (currentOutputs[file] !== hash) {
				return false;
			}
		}

		return true;
	}

	private diffInputs(oldInputs: Record<string, string>, currentInputs: Record<string, string>): CacheMissReason[] {
		const currentInputsKeys = Object.keys(currentInputs);
		const removedReasons = Object.keys(oldInputs).flatMap<CacheMissReason>((file) => {
			if (!currentInputsKeys.includes(file)) {
				return [{ file, type: "input-removed" }];
			}

			return [];
		});

		const addedOrChangedReasons: CacheMissReason[] = Object.entries(currentInputs).flatMap<CacheMissReason>(([file, currentHash]) => {
			const oldHash = oldInputs[file];

			if (oldHash === undefined) {
				return [{ file, type: "input-added" }];
			}

			if (oldHash !== currentHash) {
				return [{ file, type: "input-changed" }];
			}

			return [];
		});

		return [...removedReasons, ...addedOrChangedReasons];
	}

	async update(validationResult: CacheValidationResult) {
		if (validationResult.result === "not-cacheable") {
			// Do nothing, the task is not cacheable
		} else if (validationResult.result === "up-to-date") {
			// Do nothing, the task is up-to-date
		} else if (validationResult.result === "restore-from-cache") {
			await this.cacheManager.writeLatestRunMetadata(validationResult.cacheQuery);
		} else if (validationResult.result === "cache-miss") {
			const { cacheQuery, inputHashes } = validationResult;

			const outputs = await FileSet.resolve(this.workingDir, this.taskConfiguration.outputs);
			const outputHashes = await hashFiles(outputs);

			await this.cacheManager.writeRunMetadata(cacheQuery, RunCacheMetadata.create({ inputs: inputHashes, outputs: outputHashes, ...cacheQuery }));
		} else {
			throw new Error("Unknown cache validation result: " + JSON.stringify(validationResult));
		}
	}
}
