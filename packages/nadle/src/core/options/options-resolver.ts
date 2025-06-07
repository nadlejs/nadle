import Os from "node:os";
import Fs from "node:fs";
import Path from "node:path";
import Process from "node:process";

import { isCI } from "std-env";
import { findUpSync } from "find-up";

import { type NadleCLIOptions, type NadleResolvedOptions, type NadleConfigFileOptions } from "./types.js";

export class OptionsResolver {
	static SUPPORT_EXTENSIONS = ["js", "mjs", "ts", "mts"];

	private readonly defaultOptions = {
		sequence: false,
		logLevel: "log",
		showConfig: false,
		showSummary: !isCI,

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

		return { ...baseOptions, minWorkers, maxWorkers, configPath: this.resolveConfigPath(baseOptions.configPath) };
	}

	private resolveConfigPath(configPath: string | undefined): string {
		const cwd = Process.cwd();

		if (configPath !== undefined) {
			const resolvedConfigPath = Path.resolve(cwd, configPath);

			if (!Fs.existsSync(resolvedConfigPath)) {
				throw new Error(`Config file not found at ${resolvedConfigPath}. Please check the path.`);
			}

			return resolvedConfigPath;
		}

		const resolveConfigPath = findUpSync(OptionsResolver.SUPPORT_EXTENSIONS.map((ext) => `nadle.config.${ext}`));

		if (!resolveConfigPath) {
			throw new Error(
				`No nadle.config.{${OptionsResolver.SUPPORT_EXTENSIONS.join(",")}} found in ${Process.cwd()} directory or parent directories. Please use --config to specify a custom path.`
			);
		}

		return resolveConfigPath;
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
