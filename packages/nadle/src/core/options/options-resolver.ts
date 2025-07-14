import Os from "node:os";
import Path from "node:path";

import { isCI } from "std-env";

import { clamp } from "../utilities/utils.js";
import { Project } from "../models/project/project.js";
import { ProjectResolver } from "./project-resolver.js";
import { TaskInputResolver } from "./task-input-resolver.js";
import { DEFAULT_CACHE_DIR_NAME } from "../utilities/constants.js";
import { RootWorkspace } from "../models/project/root-workspace.js";
import { type TaskRegistry } from "../registration/task-registry.js";
import { fileOptionRegistry } from "../registration/file-option-registry.js";
import { type DefaultLogger } from "../interfaces/defaults/default-logger.js";
import { DefaultFileReader } from "../interfaces/defaults/default-file-reader.js";
import { type NadleCLIOptions, type NadleFileOptions, type NadleResolvedOptions } from "./types.js";

export class OptionsResolver {
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

	private readonly fileOptionRegistry = fileOptionRegistry;

	public constructor(
		private readonly logger: DefaultLogger,
		private readonly taskRegistry: TaskRegistry
	) {}

	public async resolve(cliOptions: NadleCLIOptions): Promise<NadleResolvedOptions> {
		this.logger.configure(cliOptions);

		const { project, fileOptions } = await this.resolveProject(cliOptions.configFile);
		const baseOptions = { ...this.defaultOptions, ...fileOptions, ...cliOptions };

		this.logger.configure(baseOptions);
		this.taskRegistry.configure(project);

		return {
			...baseOptions,
			project,

			cacheDir: Path.resolve(project.rootWorkspace.absolutePath, baseOptions.cacheDir ?? DEFAULT_CACHE_DIR_NAME),

			...this.resolveWorkers(baseOptions),
			...this.resolveTasks(project, baseOptions)
		};
	}

	private resolveWorkers(config: Partial<Record<"maxWorkers" | "minWorkers", string | number>>) {
		const maxWorkers = this.resolveWorker(config.maxWorkers);
		const minWorkers = Math.min(this.resolveWorker(config.minWorkers), maxWorkers);

		return { maxWorkers, minWorkers };
	}

	private resolveWorker(configValue: string | number | undefined) {
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

	private resolveTasks(project: Project, options: { tasks?: string[]; excludedTasks?: string[] }) {
		const taskInputResolver = new TaskInputResolver(this.logger, this.taskRegistry.getTaskNameByWorkspace.bind(this.taskRegistry));

		const excludedTasks = taskInputResolver.resolve(options.excludedTasks ?? [], project);
		const tasks = taskInputResolver.resolve(options.tasks ?? [], project).filter((task) => !excludedTasks.includes(task));

		return { tasks, excludedTasks };
	}

	private async resolveProject(configFileInput: string | undefined): Promise<{ project: Project; fileOptions: NadleFileOptions }> {
		const fileReader = new DefaultFileReader();

		const project = await new ProjectResolver().resolve(configFileInput, async (workspaceId: string, configFilePath: string) => {
			this.taskRegistry.onConfigureWorkspace(workspaceId);
			this.fileOptionRegistry.onConfigureWorkspace(workspaceId);

			await fileReader.read(configFilePath);
		});

		const { alias, ...fileOptions } = this.fileOptionRegistry.get(RootWorkspace.ID);

		return { fileOptions, project: Project.configure(project, alias) };
	}
}
