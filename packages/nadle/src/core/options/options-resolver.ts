import Fs from "node:fs";
import Os from "node:os";
import Path from "node:path";

import { isCI } from "std-env";
import { findUpSync } from "find-up";
import { findRootSync } from "@manypkg/find-root";

import { clamp } from "../utils.js";
import { isPathExistsSync } from "../fs-utils.js";
import { type TaskResolver } from "../resolve-task.js";
import { type TaskRegistry } from "../task-registry.js";
import { DEFAULT_CONFIG_FILE_NAME } from "../constants.js";
import { type NadleCLIOptions, type NadlePackageJson, type NadleResolvedOptions, type NadleConfigFileOptions } from "./types.js";

export class OptionsResolver {
	// eslint-disable-next-line no-restricted-properties
	private readonly cwd = process.cwd();
	static readonly SUPPORT_EXTENSIONS = ["js", "mjs", "ts", "mts"];
	private static readonly DEFAULT_CACHE_DIR_NAME = ".nadle";

	private readonly defaultOptions = {
		cache: true,
		footer: !isCI,
		parallel: false,
		logLevel: "log",
		cleanCache: false,
		showConfig: false,
		excludedTasks: [] as string[],

		isWorkerThread: false
	} as const;

	#options: NadleResolvedOptions;

	constructor(
		private readonly cliOptions: NadleCLIOptions,
		private readonly taskResolver: TaskResolver,
		private readonly taskRegistry: TaskRegistry
	) {
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

		const maxWorkers = this.resolveWorkers(baseOptions.maxWorkers);
		const minWorkers = Math.min(this.resolveWorkers(baseOptions.minWorkers), maxWorkers);

		const allTasks = this.taskRegistry.getAllByName();
		const excludedTasks = baseOptions.excludedTasks.length && allTasks.length ? this.taskResolver.resolve(baseOptions.excludedTasks, allTasks) : [];

		const projectDir = this.resolveProjectDir();
		const cacheDir = Path.resolve(projectDir, baseOptions.cacheDir ?? OptionsResolver.DEFAULT_CACHE_DIR_NAME);

		return {
			...baseOptions,
			cacheDir,
			projectDir,

			minWorkers,
			maxWorkers,
			excludedTasks,
			configPath: this.resolveConfigPath(baseOptions.configPath)
		};
	}

	private resolveProjectDir(): string {
		const projectDir = findUpSync(
			(directory) => {
				const packageJsonPath = Path.join(directory, "package.json");
				const hasPackageJson = isPathExistsSync(packageJsonPath);

				if (!hasPackageJson) {
					return undefined;
				}

				const packageJson = JSON.parse(Fs.readFileSync(packageJsonPath, "utf-8")) as NadlePackageJson;

				if (!packageJson.nadle?.root) {
					return undefined;
				}

				return directory;
			},
			{ type: "directory" }
		);

		if (projectDir !== undefined) {
			return projectDir;
		}

		const root = findRootSync(this.cwd);

		return root.rootDir;
	}

	private resolveConfigPath(configPath: string | undefined): string {
		if (configPath !== undefined) {
			const resolvedConfigPath = Path.resolve(this.cwd, configPath);

			if (!Fs.existsSync(resolvedConfigPath)) {
				throw new Error(`Config file not found at ${resolvedConfigPath}. Please check the path.`);
			}

			return resolvedConfigPath;
		}

		const resolveConfigPath = findUpSync(OptionsResolver.SUPPORT_EXTENSIONS.map((ext) => `${DEFAULT_CONFIG_FILE_NAME}.${ext}`));

		if (!resolveConfigPath) {
			throw new Error(
				`No ${DEFAULT_CONFIG_FILE_NAME}.{${OptionsResolver.SUPPORT_EXTENSIONS.join(",")}} found in ${this.cwd} directory or parent directories. Please use --config to specify a custom path.`
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
