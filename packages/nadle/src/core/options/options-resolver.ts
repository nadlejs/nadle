import Os from "node:os";
import Path from "node:path";

import { isCI } from "std-env";
import { findUp } from "find-up";

import { clamp } from "../utilities/utils.js";
import { Project } from "./project-resolver.js";
import { isPathExists } from "../utilities/fs.js";
import { type NadleCLIOptions, type NadleFileOptions, type NadleResolvedOptions } from "./types.js";

export class OptionsResolver {
	public static readonly SUPPORT_EXTENSIONS = ["js", "mjs", "ts", "mts"];
	public static readonly DEFAULT_CONFIG_FILE_NAME = "nadle.config";
	public static readonly CONFIG_FILE_PATTERN = `${OptionsResolver.DEFAULT_CONFIG_FILE_NAME}.{${OptionsResolver.SUPPORT_EXTENSIONS.join(",")}}`;

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

	public async resolveRootConfigFile(project: Project, configPath: string | undefined): Promise<string> {
		const projectPath = project.rootWorkspace.absolutePath;

		if (configPath !== undefined) {
			const resolvedConfigPath = Path.resolve(projectPath, configPath);

			if (!(await isPathExists(resolvedConfigPath))) {
				throw new Error(`Config file not found at ${resolvedConfigPath}. Please check the path.`);
			}

			return resolvedConfigPath;
		}

		const resolveConfigPath = await findUp(
			OptionsResolver.SUPPORT_EXTENSIONS.map((ext) => `${OptionsResolver.DEFAULT_CONFIG_FILE_NAME}.${ext}`),
			{ cwd: projectPath }
		);

		if (!resolveConfigPath) {
			throw new Error(
				`No ${OptionsResolver.CONFIG_FILE_PATTERN}} found in ${projectPath} directory or parent directories. Please use --config to specify a custom path.`
			);
		}

		return resolveConfigPath;
	}

	public async resolveWorkspaceConfigFile(workspacePath: string): Promise<string | null> {
		for (const extension of OptionsResolver.SUPPORT_EXTENSIONS) {
			// TODO: Support customized config file path?
			const configFilePath = Path.resolve(workspacePath, `${OptionsResolver.DEFAULT_CONFIG_FILE_NAME}.${extension}`);

			if (await isPathExists(configFilePath)) {
				return configFilePath;
			}
		}

		return null;
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
