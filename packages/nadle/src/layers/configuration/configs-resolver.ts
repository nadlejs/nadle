import Fs from "node:fs";
import Os from "node:os";
import Path from "node:path";
import Process from "node:process";

import { isCI } from "std-env";
import { findUpSync } from "find-up";

import { clamp } from "../utilities/utils.js";
import { DEFAULT_CONFIG_FILE_NAME } from "../constants.js";
import { type NadleCLIConfigurations, type NadleResolvedConfigurations, type NadleConfigFileConfigurations } from "./types.js";

export class ConfigsResolver {
	static readonly SUPPORT_EXTENSIONS = ["js", "mjs", "ts", "mts"];

	private readonly defaultConfigs = {
		parallel: false,
		logLevel: "log",
		showConfig: false,
		showSummary: !isCI,

		isWorkerThread: false
	} as const;

	#configs: NadleResolvedConfigurations;

	constructor(private readonly cliConfigs: NadleCLIConfigurations) {
		this.#configs = this.resolve();
	}

	public get configs(): NadleResolvedConfigurations {
		return this.#configs;
	}

	public addConfigFileConfigs(configFileConfigs: Partial<NadleConfigFileConfigurations>) {
		this.#configs = this.resolve(configFileConfigs);
	}

	private resolve(configFileConfigs?: Partial<NadleConfigFileConfigurations>): NadleResolvedConfigurations {
		const baseConfigs = {
			...this.defaultConfigs,
			...configFileConfigs,
			...this.cliConfigs
		};

		const maxWorkers = this.resolveWorkers(baseConfigs.maxWorkers);
		const minWorkers = Math.min(this.resolveWorkers(baseConfigs.minWorkers), maxWorkers);

		return { ...baseConfigs, minWorkers, maxWorkers, configPath: this.resolveConfigPath(baseConfigs.configPath) };
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

		const resolveConfigPath = findUpSync(ConfigsResolver.SUPPORT_EXTENSIONS.map((ext) => `${DEFAULT_CONFIG_FILE_NAME}.${ext}`));

		if (!resolveConfigPath) {
			throw new Error(
				`No ${DEFAULT_CONFIG_FILE_NAME}.{${ConfigsResolver.SUPPORT_EXTENSIONS.join(",")}} found in ${Process.cwd()} directory or parent directories. Please use --config to specify a custom path.`
			);
		}

		return resolveConfigPath;
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
