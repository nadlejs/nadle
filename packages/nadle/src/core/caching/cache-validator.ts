import { FileSet } from "./file-set.js";
import { CacheKey } from "./cache-key.js";
import { RunCacheMetadata } from "./metadata.js";
import { CacheManager } from "./cache-manager.js";
import type { CacheQuery } from "./cache-query.js";
import { type TaskConfiguration } from "../types.js";
import { type CacheMissReason } from "./cache-miss-reason.js";

type CacheValidationResult =
	| { result: "no-cache-configurations" }
	| {
			result: "hit";
			cacheQuery: CacheQuery;
			inputHashes: Record<string, string>;
	  }
	| {
			result: "miss";
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
			return { result: "no-cache-configurations" };
		}

		const inputs = await FileSet.resolve(this.workingDir, this.taskConfiguration.inputs);
		const { cacheKey, inputHashes } = await CacheKey.compute({ inputs, taskName: this.taskName });
		const cacheQuery: CacheQuery = { cacheKey, taskName: this.taskName };
		const hit = await this.cacheManager.hasCache(cacheQuery);

		if (hit) {
			return { cacheQuery, inputHashes, result: "hit" };
		}

		const latestRunMetadata = await this.cacheManager.readLatestRunMetadata(this.taskName);

		if (!latestRunMetadata) {
			return { cacheQuery, inputHashes, result: "miss", reasons: [{ type: "no-previous-metadata" }] };
		}

		return { cacheQuery, inputHashes, result: "miss", reasons: this.diffInputs(latestRunMetadata.inputs, inputHashes) };
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

			if (currentHash !== undefined) {
				return [{ file, type: "input-changed" }];
			}

			return [];
		});

		return [...removedReasons, ...addedOrChangedReasons];
	}

	async update(validationResult: CacheValidationResult) {
		if (validationResult.result === "no-cache-configurations") {
			return;
		}

		const { cacheQuery, inputHashes } = validationResult;
		await this.cacheManager.writeRunMetadata(
			cacheQuery,
			RunCacheMetadata.create({ inputs: inputHashes, taskName: this.taskName, cacheKey: cacheQuery.cacheKey })
		);
	}
}
