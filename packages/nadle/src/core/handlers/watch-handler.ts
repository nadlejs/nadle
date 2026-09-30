import Path from "node:path";
import Process from "node:process";

import c from "tinyrainbow";
import { getWorkspaceById } from "@nadle/project-resolver";

import { BaseHandler } from "./base-handler.js";
import { TaskPool } from "../engine/task-pool.js";
import { Messages } from "../utilities/messages.js";
import { TaskWatcher } from "../watch/task-watcher.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import { Declaration } from "../models/cache/declaration.js";
import { ResolvedTask } from "../interfaces/resolved-task.js";

export class WatchHandler extends BaseHandler {
	public readonly name = "watch";
	public readonly description = "Re-runs the requested tasks when their inputs change.";

	public canHandle(): boolean {
		return this.context.options.watch;
	}

	public async handle(): Promise<void> {
		if (this.context.options.tasks.length === 0) {
			this.context.logger.log(Messages.NoTasksFound());

			return;
		}

		const chosenTasks = this.context.options.tasks.map(ResolvedTask.getId);
		const scheduler = this.context.taskScheduler.init(chosenTasks);
		const watchPaths = await this.collectWatchPaths(scheduler.scheduledTask);

		if (watchPaths.length === 0) {
			this.context.logger.warn("No watchable inputs for the requested tasks — nothing to watch.");

			return;
		}

		const runOnce = async (): Promise<void> => {
			try {
				const runScheduler = this.context.taskScheduler.init(chosenTasks);
				await this.context.eventEmitter.onTasksScheduled(runScheduler.scheduledTask.map((taskId) => this.context.taskRegistry.getTaskById(taskId)));
				await new TaskPool(this.context, (taskId) => runScheduler.getReadyTasks(taskId)).run();
			} catch (error) {
				// Watch mode never exits on a failed run — report and keep watching.
				this.context.logger.error(error instanceof Error ? error.message : String(error));
			}

			this.context.logger.log(c.dim("\nWatching for changes… (press Ctrl-C to exit)"));
		};

		await runOnce();

		const watcher = new TaskWatcher(watchPaths);
		watcher.start(runOnce);

		await new Promise<void>((resolve) => {
			const shutdown = () => {
				void watcher.close().then(resolve);
			};

			Process.once("SIGINT", shutdown);
			Process.once("SIGTERM", shutdown);
		});
	}

	private async collectWatchPaths(taskIds: string[]): Promise<string[]> {
		const paths = new Set<string>();
		let anyInputs = false;

		for (const taskId of taskIds) {
			const task = this.context.taskRegistry.getTaskById(taskId);
			const config = task.configResolver();

			if (config.inputs === undefined) {
				continue;
			}

			anyInputs = true;

			const workspace = getWorkspaceById(this.context.options.project, task.workspaceId);
			const workingDir = Path.resolve(workspace.absolutePath, config.workingDir ?? "");

			for (const declaration of MaybeArray.toArray(config.inputs)) {
				for (const resolved of await Declaration.resolve(declaration, workingDir)) {
					paths.add(resolved);
				}
			}
		}

		// Only watch config files when there is something input-driven to re-run;
		// watching config for a graph of no-input tasks would re-run pointlessly.
		if (anyInputs) {
			const { rootWorkspace } = this.context.options.project;

			if (rootWorkspace.configFilePath) {
				paths.add(rootWorkspace.configFilePath);
			}
		}

		return [...paths];
	}
}
