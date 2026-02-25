import { CacheManager } from "./cache-manager.js";
import { hashObject } from "../utilities/hash.js";
import { stringify } from "../utilities/stringify.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import { FileFingerprints } from "../models/cache/fingerprint.js";
import { RunCacheMetadata } from "../models/cache/cache-metadata.js";
import { CacheMissReason } from "../models/cache/cache-miss-reason.js";
import { CacheKey, type CacheQuery } from "../models/cache/cache-key.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

type CacheValidationResult =
	| { result: "not-cacheable" }
	| { result: "cache-disabled" }
	| { result: "up-to-date"; outputsFingerprint: string }
	| { cacheQuery: CacheQuery; outputsFingerprint: string; result: "restore-from-cache"; restore: () => Promise<void> }
	| { result: "cache-miss"; cacheQuery: CacheQuery; reasons: CacheMissReason[]; inputsFingerprints: FileFingerprints };

interface CacheValidatorContext {
	readonly cache: boolean;
	readonly cacheDir: string;
	readonly projectDir: string;
	readonly workingDir: string;
	readonly taskOptions?: object;
	readonly configFiles: string[];
	readonly maxCacheEntries: number;
	readonly dependencyFingerprints: Record<string, string>;
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

		const { cacheQuery, inputsFingerprints } = await this.computeCacheQuery();
		const hasCache = await this.cacheManager.hasCache(cacheQuery);
		const latestRunMetadata = await this.cacheManager.readLatestRunMetadata(this.taskId);

		if (!hasCache || latestRunMetadata === null) {
			return {
				cacheQuery,
				inputsFingerprints,
				result: "cache-miss",
				reasons: CacheMissReason.compute(latestRunMetadata?.inputsFingerprints, inputsFingerprints)
			};
		}

		const outputHashes = hashObject(
			await FileFingerprints.compute({
				workingDir: this.context.workingDir,
				declarations: MaybeArray.toArray(this.taskConfiguration.outputs)
			})
		);

		if (latestRunMetadata.cacheKey === cacheQuery.cacheKey && latestRunMetadata.outputsFingerprint === outputHashes) {
			return { result: "up-to-date", outputsFingerprint: latestRunMetadata.outputsFingerprint };
		}

		return {
			cacheQuery,
			result: "restore-from-cache",
			outputsFingerprint: latestRunMetadata.outputsFingerprint,
			restore: () => this.cacheManager.restoreOutputs(cacheQuery)
		};
	}

	private async computeCacheQuery(): Promise<{ cacheQuery: CacheQuery; inputsFingerprints: FileFingerprints }> {
		const inputsFingerprints = await FileFingerprints.compute({
			files: this.context.configFiles,
			workingDir: this.context.workingDir,
			declarations: MaybeArray.toArray(this.taskConfiguration.inputs!)
		});
		const cacheKey = await CacheKey.compute({
			inputsFingerprints,
			taskId: this.taskId,
			env: this.taskConfiguration.env,
			options: this.context.taskOptions,
			dependencyFingerprints: Object.keys(this.context.dependencyFingerprints).length > 0 ? this.context.dependencyFingerprints : undefined
		});

		return { inputsFingerprints, cacheQuery: { cacheKey, taskId: this.taskId } };
	}

	public async update(validationResult: CacheValidationResult): Promise<string | undefined> {
		if (validationResult.result === "not-cacheable" || validationResult.result === "cache-disabled") {
			return undefined;
		}

		if (validationResult.result === "up-to-date") {
			return undefined;
		}

		if (validationResult.result === "restore-from-cache") {
			await this.cacheManager.writeLatestRunMetadata(validationResult.cacheQuery);

			return undefined;
		}

		if (validationResult.result === "cache-miss") {
			const { cacheQuery, inputsFingerprints } = validationResult;

			const outputsFingerprints = await FileFingerprints.compute({
				workingDir: this.context.workingDir,
				declarations: MaybeArray.toArray(this.taskConfiguration.outputs ?? [])
			});

			const outputsFingerprint = hashObject(outputsFingerprints);

			await this.cacheManager.writeRunMetadata(cacheQuery, RunCacheMetadata.create({ inputsFingerprints, outputsFingerprint, ...cacheQuery }));
			await this.cacheManager.saveOutputs(cacheQuery, Object.keys(outputsFingerprints));
			await this.cacheManager.evict(this.taskId, this.context.maxCacheEntries);

			return outputsFingerprint;
		}

		throw new Error("Unknown cache validation result: " + stringify(validationResult));
	}
}
