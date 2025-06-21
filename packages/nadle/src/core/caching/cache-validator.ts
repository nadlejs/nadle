import { hashObject } from "../utils.js";
import { CacheKey } from "./cache-key.js";
import { Declaration } from "./declaration.js";
import { RunCacheMetadata } from "./metadata.js";
import { CacheManager } from "./cache-manager.js";
import type { CacheQuery } from "./cache-query.js";
import { type TaskConfiguration } from "../types.js";
import type { FileFingerprints } from "./fingerprint.js";
import { CacheMissReason } from "./cache-miss-reason.js";

type CacheValidationResult =
	| { result: "not-cacheable" }
	| { result: "cache-disabled" }
	| { result: "up-to-date" }
	| { cacheQuery: CacheQuery; result: "restore-from-cache"; restore: () => Promise<void> }
	| { result: "cache-miss"; cacheQuery: CacheQuery; reasons: CacheMissReason[]; inputsFingerprints: FileFingerprints };

interface CacheValidatorContext {
	readonly cache: boolean;
	readonly projectDir: string;
	readonly workingDir: string;
}

export class CacheValidator {
	private readonly cacheManager: CacheManager;

	constructor(
		private readonly taskName: string,
		private readonly taskConfiguration: TaskConfiguration,
		private readonly context: CacheValidatorContext
	) {
		this.cacheManager = new CacheManager(this.context.projectDir);
	}

	async validate(): Promise<CacheValidationResult> {
		if (this.taskConfiguration.inputs === undefined || this.taskConfiguration.outputs === undefined) {
			return { result: "not-cacheable" };
		}

		if (!this.context.cache) {
			return { result: "cache-disabled" };
		}

		const taskName = this.taskName;

		const inputsFingerprints = await Declaration.computeFileFingerprints(this.context.workingDir, this.taskConfiguration.inputs);
		const cacheKey = await CacheKey.compute({ taskName, inputsFingerprints });
		const cacheQuery: CacheQuery = { cacheKey, taskName };

		const hasCache = await this.cacheManager.hasCache(cacheQuery);
		const latestRunMetadata = await this.cacheManager.readLatestRunMetadata(taskName);

		if (!hasCache) {
			return {
				cacheQuery,
				inputsFingerprints,
				result: "cache-miss",
				reasons: CacheMissReason.fromFingerprint(latestRunMetadata?.inputsFingerprints, inputsFingerprints)
			};
		}

		if (latestRunMetadata === null) {
			throw new Error("Unable to read latest run metadata for task: " + taskName);
		}

		const outputHashes = hashObject(await Declaration.computeFileFingerprints(this.context.workingDir, this.taskConfiguration.outputs));

		if (latestRunMetadata.cacheKey === cacheKey && latestRunMetadata.outputsFingerprint === outputHashes) {
			return { result: "up-to-date" };
		}

		return {
			cacheQuery,
			result: "restore-from-cache",
			restore: () => this.cacheManager.restoreOutputs(cacheQuery, this.context.projectDir)
		};
	}

	async update(validationResult: CacheValidationResult) {
		if (validationResult.result === "not-cacheable") {
			// Do nothing, the task is not cacheable
			return;
		}

		if (validationResult.result === "up-to-date") {
			// Do nothing, the task is up-to-date
			return;
		}

		if (validationResult.result === "restore-from-cache") {
			await this.cacheManager.writeLatestRunMetadata(validationResult.cacheQuery);

			return;
		}

		if (validationResult.result === "cache-miss") {
			const { cacheQuery, inputsFingerprints } = validationResult;

			const outputsFingerprints = await Declaration.computeFileFingerprints(this.context.workingDir, this.taskConfiguration.outputs ?? []);

			await this.cacheManager.writeRunMetadata(
				cacheQuery,
				RunCacheMetadata.create({ inputsFingerprints, outputsFingerprint: hashObject(outputsFingerprints), ...cacheQuery })
			);
			await this.cacheManager.saveOutputs(cacheQuery, this.context.projectDir, Object.keys(outputsFingerprints));

			return;
		}

		throw new Error("Unknown cache validation result: " + JSON.stringify(validationResult));
	}
}
