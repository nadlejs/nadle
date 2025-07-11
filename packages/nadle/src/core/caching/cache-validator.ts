import { CacheManager } from "./cache-manager.js";
import { hashObject } from "../utilities/hash.js";
import { CacheKey } from "../models/cache/cache-key.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import type { CacheQuery } from "../models/cache/cache-query.js";
import { FileFingerprints } from "../models/cache/fingerprint.js";
import { CacheMissReason } from "../models/cache/cache-miss-reason.js";
import { RunCacheMetadata } from "../models/cache/run-cache-metadata.js";
import { type TaskConfiguration } from "../models/task/task-configuration.js";

type CacheValidationResult =
	| { result: "not-cacheable" }
	| { result: "cache-disabled" }
	| { result: "up-to-date" }
	| { cacheQuery: CacheQuery; result: "restore-from-cache"; restore: () => Promise<void> }
	| { result: "cache-miss"; cacheQuery: CacheQuery; reasons: CacheMissReason[]; inputsFingerprints: FileFingerprints };

interface CacheValidatorContext {
	readonly cache: boolean;
	readonly cacheDir: string;
	readonly configFile: string;
	readonly projectDir: string;
	readonly workingDir: string;
}

export class CacheValidator {
	private readonly cacheManager: CacheManager;

	public constructor(
		private readonly taskId: string,
		private readonly taskConfiguration: TaskConfiguration,
		private readonly context: CacheValidatorContext
	) {
		this.cacheManager = new CacheManager(this.context.projectDir, this.context.cacheDir);
	}

	public async validate(): Promise<CacheValidationResult> {
		if (this.taskConfiguration.inputs === undefined || this.taskConfiguration.outputs === undefined) {
			return { result: "not-cacheable" };
		}

		if (!this.context.cache) {
			return { result: "cache-disabled" };
		}

		const taskId = this.taskId;

		const inputsFingerprints = await FileFingerprints.compute({
			files: [this.context.configFile],
			workingDir: this.context.workingDir,
			declarations: MaybeArray.toArray(this.taskConfiguration.inputs)
		});
		const cacheKey = await CacheKey.compute({ taskId, inputsFingerprints });
		const cacheQuery: CacheQuery = { taskId, cacheKey };

		const hasCache = await this.cacheManager.hasCache(cacheQuery);
		const latestRunMetadata = await this.cacheManager.readLatestRunMetadata(taskId);

		if (!hasCache) {
			return {
				cacheQuery,
				inputsFingerprints,
				result: "cache-miss",
				reasons: CacheMissReason.compute(latestRunMetadata?.inputsFingerprints, inputsFingerprints)
			};
		}

		if (latestRunMetadata === null) {
			throw new Error("Unable to read latest run metadata for task: " + taskId);
		}

		const outputHashes = hashObject(
			await FileFingerprints.compute({
				workingDir: this.context.workingDir,
				declarations: MaybeArray.toArray(this.taskConfiguration.outputs)
			})
		);

		if (latestRunMetadata.cacheKey === cacheKey && latestRunMetadata.outputsFingerprint === outputHashes) {
			return { result: "up-to-date" };
		}

		return {
			cacheQuery,
			result: "restore-from-cache",
			restore: () => this.cacheManager.restoreOutputs(cacheQuery)
		};
	}

	public async update(validationResult: CacheValidationResult) {
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

			const outputsFingerprints = await FileFingerprints.compute({
				workingDir: this.context.workingDir,
				declarations: MaybeArray.toArray(this.taskConfiguration.outputs ?? [])
			});

			await this.cacheManager.writeRunMetadata(
				cacheQuery,
				RunCacheMetadata.create({ inputsFingerprints, outputsFingerprint: hashObject(outputsFingerprints), ...cacheQuery })
			);
			await this.cacheManager.saveOutputs(cacheQuery, Object.keys(outputsFingerprints));

			return;
		}

		throw new Error("Unknown cache validation result: " + JSON.stringify(validationResult));
	}
}
