import Url from "node:url";

import c from "tinyrainbow";
import { isCI, isTest } from "std-env";

import { Nadle } from "../nadle.js";
import { type ExecutionContext } from "../context.js";
import { stringify } from "../utilities/stringify.js";
import { type Listener } from "../interfaces/listener.js";
import { highlight, formatTime } from "../utilities/utils.js";
import { StringBuilder } from "../utilities/string-builder.js";
import { FooterRenderer } from "./renderers/footer-renderer.js";
import { renderProfilingSummary } from "./profiling-summary.js";
import { DefaultRenderer } from "./renderers/default-renderer.js";
import { TaskStatus, type RegisteredTask } from "../interfaces/registered-task.js";
import { type TaskStats, type ExecutionTracker } from "../models/execution-tracker.js";
import { DASH, CHECK, CROSS, CURVE_ARROW, RIGHT_ARROW, VERTICAL_BAR } from "../utilities/constants.js";

export class DefaultReporter implements Listener {
	private renderer = new DefaultRenderer();
	private tracker: ExecutionTracker;

	public constructor(private readonly context: ExecutionContext) {
		this.tracker = this.context.executionTracker;
	}

	public onInitialize() {
		this.renderer = this.context.options.footer
			? new FooterRenderer({ logger: this.context.logger, getWindow: () => this.createFooter() })
			: new DefaultRenderer();

		return this;
	}

	private printLabel(label: string) {
		return c.dim(label.padEnd(11, " "));
	}

	private createFooter() {
		const footer: string[] = [""];

		if (this.context.options.tasks.length === 0 && this.context.state.selectingTasks) {
			return footer;
		}

		const doneTask = this.stats[TaskStatus.Finished] + this.stats[TaskStatus.FromCache] + this.stats[TaskStatus.UpToDate];

		const stats = [
			c.cyanBright(`${this.stats[TaskStatus.Scheduled] - this.stats[TaskStatus.Running] - this.stats[TaskStatus.Failed] - doneTask} pending`),
			c.yellow(`${this.stats[TaskStatus.Running]} running`),
			c.green(`${this.stats[TaskStatus.Finished]} done`)
		].join(` ${c.gray(VERTICAL_BAR)} `);

		footer.push([this.printLabel("Tasks"), stats, c.dim(`(${this.stats[TaskStatus.Scheduled]} scheduled)`)].join(" "));
		footer.push([this.printLabel("Duration"), formatTime(this.duration)].join(" "));

		footer.push(...this.printRunningTasks());

		footer.push("");

		return footer;
	}

	private printRunningTasks() {
		const lines = Array.from({ length: this.context.options.maxWorkers }, () => ` ${c.yellow(">")} ${c.dim("IDLE")}`);

		let maxThreadId = 0;

		for (const { label, threadId } of this.tracker.getTaskStateByStatus(TaskStatus.Running)) {
			if (threadId === null) {
				throw new Error(`Task ${label} is running but has no worker ID assigned.`);
			}

			lines[threadId - 1] = ` ${c.yellow(">")} ${c.bold(label)}`;
			maxThreadId = Math.max(maxThreadId, threadId);
		}

		return lines.slice(0, maxThreadId);
	}

	public async onTaskStart(task: RegisteredTask) {
		if (!task.empty) {
			this.context.logger.log(`${c.yellow(">")} Task ${c.bold(task.label)} ${c.yellow("STARTED")}\n`);
		}

		this.renderer.schedule();
	}

	public async onTaskFinish(task: RegisteredTask) {
		const prefix = task.empty ? "" : "\n";
		this.context.logger.log(
			`${prefix}${c.green(CHECK)} Task ${c.bold(task.label)} ${c.green("DONE")} ${c.dim(formatTime(this.tracker.getTaskState(task.id).duration ?? 0))}`
		);
		this.renderer.schedule();
	}

	public async onTaskUpToDate(task: RegisteredTask) {
		this.context.logger.log(`\n${c.green(DASH)} Task ${c.bold(task.label)} ${c.green("UP-TO-DATE")}`);
		this.renderer.schedule();
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.context.logger.log(`\n${c.green(CURVE_ARROW)} Task ${c.bold(task.label)} ${c.green("FROM-CACHE")}`);
		this.renderer.schedule();
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.context.logger.log(
			`\n${c.red(CROSS)} Task ${c.bold(task.label)} ${c.red("FAILED")} ${formatTime(this.tracker.getTaskState(task.id).duration ?? 0)}`
		);
		this.renderer.schedule();
	}

	public async onTaskCanceled(task: RegisteredTask) {
		this.context.logger.log(`\n${c.yellow(CROSS)} Task ${c.bold(task.label)} ${c.yellow("CANCELED")}`);
		this.renderer.schedule();
	}

	public async onTasksScheduled(tasks: RegisteredTask[]) {
		this.context.logger.info(`Scheduled tasks: ${tasks.map((task) => task.id).join(", ")}`);
		this.renderer.schedule();
	}

	public onExecutionStart() {
		this.renderer.start();

		const { project, minWorkers, maxWorkers } = this.context.options;

		const workspaceConfigFileCount = project.workspaces.flatMap((workspace) => workspace.configFilePath ?? []).length;

		if (!this.context.options.showConfig) {
			this.context.logger.log(c.bold(c.cyan(`▶ Welcome to Nadle v${Nadle.version}!`)));
			this.context.logger.log(`Using Nadle from ${Url.fileURLToPath(import.meta.resolve("nadle"))}`);
			this.context.logger.log(
				`Loaded configuration from ${project.rootWorkspace.configFilePath}${workspaceConfigFileCount > 0 ? ` and ${workspaceConfigFileCount} other(s) files` : ""}\n`
			);
		}

		this.context.logger.info(
			`Using ${minWorkers === maxWorkers ? minWorkers : `${minWorkers}–${maxWorkers}`} worker${maxWorkers > 1 ? "s" : ""} for task execution`
		);
		this.context.logger.info(`Project directory: ${project.rootWorkspace.absolutePath}`);
		this.context.logger.info("Resolved options:", stringify(this.context.options));
		this.context.logger.info("Detected environments:", { CI: isCI, TEST: isTest });
		this.printResolvedTasks();

		this.context.logger.info("Execution started");
	}

	private printResolvedTasks() {
		const resolvedTasks = [...this.context.options.tasks, ...this.context.options.excludedTasks].filter(({ corrected }) => corrected);

		if (resolvedTasks.length === 0) {
			return;
		}

		const maxOriginTaskLength = Math.max(...resolvedTasks.map(({ rawInput }) => rawInput.length));

		const message = [
			`Resolved tasks:`,
			...resolvedTasks.flatMap(({ taskId, rawInput, corrected }) => {
				if (!corrected) {
					return [];
				}

				return `${" ".repeat(4)}${highlight(rawInput.padEnd(maxOriginTaskLength, " "))}  ${RIGHT_ARROW} ${c.green(c.bold(taskId))}`;
			})
		].join("\n");
		this.context.logger.log(message + "\n");
	}

	public async onExecutionFinish() {
		this.renderer.finish();
		this.context.logger.info("Execution finished");

		if (this.context.options.showConfig) {
			return;
		}

		if (this.context.options.summary) {
			this.context.logger.log(
				renderProfilingSummary({
					totalDuration: this.duration,
					tasks: this.context.taskRegistry.tasks.flatMap((task) => {
						const { status, duration } = this.tracker.getTaskState(task.id);

						if (status !== TaskStatus.Finished) {
							return [];
						}

						return { label: task.label, duration: duration ?? 0 };
					})
				})
			);
		}

		const print = (count: number) => `${c.bold(count)} task${count > 1 ? "s" : ""}`;

		this.context.logger.log(`\n${c.bold(c.green("RUN SUCCESSFUL"))} in ${c.bold(formatTime(this.duration))}`);
		this.context.logger.log(
			new StringBuilder(", ")
				.add(`${print(this.stats[TaskStatus.Finished])} executed`)
				.add(this.stats[TaskStatus.UpToDate] > 0 && `${print(this.stats[TaskStatus.UpToDate])} up-to-date`)
				.add(this.stats[TaskStatus.FromCache] > 0 && `${print(this.stats[TaskStatus.FromCache])} restored from cache`)
				.build()
		);
	}

	public async onExecutionFailed(error: unknown) {
		this.renderer.finish();
		this.context.logger.info("Execution failed");

		const finishedTasks = `${c.bold(this.stats[TaskStatus.Finished])} task${this.stats[TaskStatus.Finished] > 1 ? "s" : ""}`;
		const failedTasks = `${c.bold(this.stats[TaskStatus.Failed])} task${this.stats[TaskStatus.Failed] > 1 ? "s" : ""}`;

		this.context.logger.log(
			`\n${c.bold(c.red("RUN FAILED"))} in ${c.bold(formatTime(this.duration))} ${c.dim(`(${finishedTasks} executed, ${failedTasks} failed)`)}`
		);

		if (!this.context.options.stacktrace) {
			this.context.logger.log(
				`\nFor more details, re-run the command with the ${c.yellow("--stacktrace")} option to display the full error and help identify the root cause.`
			);
		} else {
			this.context.logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
		}
	}

	private get stats(): TaskStats {
		return this.tracker.taskStats;
	}
	private get duration(): number {
		return this.tracker.duration;
	}
}
