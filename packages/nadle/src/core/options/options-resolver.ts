import Os from "node:os";
import process from "node:process";
import { resolve } from "node:path";

import { isCI } from "std-env";

import { type NadleCLIOptions, type NadleResolvedOptions, type NadleConfigFileOptions } from "./types.js";

export class OptionsResolver {
	private readonly defaultOptions = {
		tasks: [] as string[],

		logLevel: "log",
		showConfig: false,
		showSummary: !isCI,
		configPath: "build.nadle.ts",

		isWorkerThread: false
	} as const;

	#options: NadleResolvedOptions;

	constructor(private cliOptions: NadleCLIOptions) {
		this.#options = this.resolve();
	}

	public get options(): NadleResolvedOptions {
		return this.#options;
	}

	public addConfigFileOptions(configFileOptions: Partial<NadleConfigFileOptions>) {
		this.#options = this.resolve(configFileOptions);
	}

	private resolve(configFileOptions?: Partial<NadleConfigFileOptions>): NadleResolvedOptions {
		const baseOptions = {
			...this.defaultOptions,
			...configFileOptions,
			...this.cliOptions
		};

		const maxWorkers = this.resolveWorkerCount(baseOptions.maxWorkers);
		const minWorkers = Math.min(this.resolveWorkerCount(baseOptions.minWorkers), maxWorkers);

		return { ...baseOptions, minWorkers, maxWorkers, configPath: resolve(process.cwd(), baseOptions.configPath) };
	}

	private resolveWorkerCount(configValue: string | number | undefined) {
		if (configValue === undefined) {
			return Math.max(this.getMaxWorkersCount() - 1, 1);
		}

		if (typeof configValue === "number") {
			return configValue;
		}

		if (typeof configValue === "string") {
			return this.getWorkersCountByPercentage(configValue);
		}

		throw new Error(`Invalid worker value: ${configValue}`);
	}

	private getWorkersCountByPercentage(percent: string): number {
		const maxWorkersCount = this.getMaxWorkersCount();
		const workersCountByPercentage = Math.round((Number.parseInt(percent) / 100) * maxWorkersCount);

		return Math.max(1, Math.min(maxWorkersCount, workersCountByPercentage));
	}

	private getMaxWorkersCount() {
		return typeof Os.availableParallelism === "function" ? Os.availableParallelism() : Os.cpus().length;
	}
}
