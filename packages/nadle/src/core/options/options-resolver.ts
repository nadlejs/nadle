import Os from "node:os";
import Path from "node:path";

import { isCI } from "std-env";

import { Project } from "./project.js";
import { clamp } from "../utilities/utils.js";
import { type NadleCLIOptions, type NadleFileOptions, type NadleResolvedOptions } from "./types.js";

export class OptionsResolver {
	// eslint-disable-next-line no-restricted-properties
	public readonly cwd = process.cwd();
	private static readonly DEFAULT_CACHE_DIR_NAME = ".nadle";

	private readonly defaultOptions = {
		cache: true,
		footer: !isCI,
		summary: false,
		parallel: false,
		logLevel: "log",
		cleanCache: false,
		showConfig: false,
		excludedTasks: [] as string[],

		isWorkerThread: false
	} as const;

	public async resolve(params: { project: Project; cliOptions: NadleCLIOptions; fileOptions: NadleFileOptions }): Promise<NadleResolvedOptions> {
		const { cliOptions } = params;
		const { alias, ...fileOptions } = params.fileOptions;
		const baseOptions = { ...this.defaultOptions, ...fileOptions, ...cliOptions };

		const project = Project.configureAlias(params.project, alias);
		const cacheDir = Path.resolve(project.rootWorkspace.absolutePath, baseOptions.cacheDir ?? OptionsResolver.DEFAULT_CACHE_DIR_NAME);

		const maxWorkers = this.resolveWorkers(baseOptions.maxWorkers);
		const minWorkers = Math.min(this.resolveWorkers(baseOptions.minWorkers), maxWorkers);

		return {
			...baseOptions,
			project,
			cacheDir,
			configFile: project.rootWorkspace.configFilePath,

			minWorkers,
			maxWorkers
		};
	}

	private resolveWorkers(configValue: string | number | undefined) {
		let result: number;

		if (configValue === undefined) {
			result = this.availableWorkers - 1;
		} else if (typeof configValue === "number") {
			result = configValue;
		} else if (typeof configValue === "string") {
			result = Math.round((Number.parseInt(configValue) / 100) * this.availableWorkers);
		} else {
			throw new Error(`Invalid worker value: ${configValue}`);
		}

		return clamp(result, 1, this.availableWorkers);
	}

	private get availableWorkers() {
		if (process.env.NADLE_MAX_WORKERS) {
			return Number(process.env.NADLE_MAX_WORKERS);
		}

		return Os.availableParallelism();
	}
}
