import Path from "node:path";
import Process from "node:process";

import c from "tinyrainbow";
import { getWorkspaceById } from "@nadle/project-resolver";

import { TaskPool } from "../engine/task-pool.js";
import { BaseHandler } from "./base-handler.js";
import { Messages } from "../utilities/messages.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import { TaskWatcher } from "../watch/task-watcher.js";
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
				const sched = this.context.taskScheduler.init(chosenTasks);
				await this.context.eventEmitter.onTasksScheduled(sched.scheduledTask.map((taskId) => this.context.taskRegistry.getTaskById(taskId)));
				await new TaskPool(this.context, (taskId) => sched.getReadyTasks(taskId)).run();
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

		for (const taskId of taskIds) {
			const task = this.context.taskRegistry.getTaskById(taskId);
			const config = task.configResolver();

			if (config.inputs === undefined) {
				continue;
			}

			const workspace = getWorkspaceById(this.context.options.project, task.workspaceId);
			const workingDir = Path.resolve(workspace.absolutePath, config.workingDir ?? "");

			for (const declaration of MaybeArray.toArray(config.inputs)) {
				for (const resolved of await Declaration.resolve(declaration, workingDir)) {
					paths.add(resolved);
				}
			}
		}

		// Config files invalidate everything — watch them too.
		const { rootWorkspace } = this.context.options.project;

		if (rootWorkspace.configFilePath) {
			paths.add(rootWorkspace.configFilePath);
		}

		return [...paths];
	}
}
