import { fileURLToPath } from "node:url";

import c from "tinyrainbow";
import { isCI, isTest } from "std-env";

import { Nadle } from "../nadle.js";
import { type Awaitable } from "../types.js";
import { formatTime } from "../utilities/utils.js";
import { StringBuilder } from "../utilities/string-builder.js";
import { FooterRenderer } from "./renderers/footer-renderer.js";
import { renderProfilingSummary } from "./profiling-summary.js";
import { DefaultRenderer } from "./renderers/default-renderer.js";
import { TaskStatus, type RegisteredTask } from "../registration/types.js";
import { DASH, CHECK, CROSS, CURVE_ARROW, VERTICAL_BAR } from "../utilities/constants.js";

export interface Reporter {
	onExecutionStart?: () => Awaitable<void>;
	onExecutionFinish?: () => Awaitable<void>;
	onExecutionFailed?: (error: any) => Awaitable<void>;

	onTasksScheduled?: (tasks: string[]) => Awaitable<void>;
	onTaskFinish?: (task: RegisteredTask) => Awaitable<void>;
	onTaskFailed?: (task: RegisteredTask) => Awaitable<void>;
	onTaskCanceled?: (task: RegisteredTask) => Awaitable<void>;
	onTaskUpToDate?: (task: RegisteredTask) => Awaitable<void>;
	onTaskRestoreFromCache?: (task: RegisteredTask) => Awaitable<void>;
	onTaskStart?: (task: RegisteredTask, threadId: number) => Awaitable<void>;

	init?: () => Awaitable<void>;
}

const DURATION_UPDATE_INTERVAL_MS = 100;

export class DefaultReporter implements Reporter {
	private renderer = new DefaultRenderer();
	private taskStat = {
		failed: 0,
		running: 0,
		canceled: 0,
		upToDate: 0,
		finished: 0,
		fromCache: 0,
		scheduled: 0
	};
	private threadIdPerWorker: Record<string, number> = {};
	private currentTime = 0;
	private duration = 0;
	private durationInterval: NodeJS.Timeout | undefined = undefined;

	public constructor(public readonly nadle: Nadle) {}

	public init() {
		this.renderer = this.nadle.options.footer
			? new FooterRenderer({ logger: this.nadle.logger, getWindow: () => this.createFooter() })
			: new DefaultRenderer();
	}

	private printLabel(label: string) {
		return c.dim(label.padEnd(11, " "));
	}

	private createFooter() {
		const footer: string[] = [""];

		if (this.nadle.resolvedTasks.length === 0) {
			return footer;
		}

		const doneTask = this.taskStat.finished + this.taskStat.fromCache + this.taskStat.upToDate;

		const stats = [
			c.cyanBright(`${this.taskStat.scheduled - this.taskStat.running - this.taskStat.failed - doneTask} pending`),
			c.yellow(`${this.taskStat.running} running`),
			c.green(`${this.taskStat.finished} done`)
		].join(` ${c.gray(VERTICAL_BAR)} `);

		footer.push([this.printLabel("Tasks"), stats, c.dim(`(${this.taskStat.scheduled} scheduled)`)].join(" "));
		footer.push([this.printLabel("Duration"), formatTime(this.duration)].join(" "));

		footer.push(...this.printRunningTasks());

		footer.push("");

		return footer;
	}

	private printRunningTasks() {
		const lines = Array.from({ length: this.nadle.options.maxWorkers }, () => ` ${c.yellow(">")} ${c.dim("IDLE")}`);

		let maxWorkerId = 0;

		for (const runningTask of this.nadle.registry.getAll().filter((task) => task.status === TaskStatus.Running)) {
			const workerId = this.threadIdPerWorker[runningTask.name];

			lines[workerId - 1] = ` ${c.yellow(">")} :${c.bold(runningTask.name)}`;
			maxWorkerId = Math.max(maxWorkerId, workerId);
		}

		return lines.slice(0, maxWorkerId);
	}

	public async onTaskStart(task: RegisteredTask, threadId: number) {
		this.nadle.logger.log(`${c.yellow(">")} Task ${c.bold(task.name)} ${c.yellow("STARTED")}\n`);
		this.taskStat = { ...this.taskStat, running: ++this.taskStat.running };
		this.threadIdPerWorker = { ...this.threadIdPerWorker, [task.name]: threadId };
		this.renderer.schedule();
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(CHECK)} Task ${c.bold(task.name)} ${c.green("DONE")} ${c.dim(formatTime(task.result.duration ?? 0))}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, finished: ++this.taskStat.finished };
		this.renderer.schedule();
	}

	public async onTaskUpToDate(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(DASH)} Task ${c.bold(task.name)} ${c.green("UP-TO-DATE")}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, upToDate: ++this.taskStat.upToDate };
		this.renderer.schedule();
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(CURVE_ARROW)} Task ${c.bold(task.name)} ${c.green("FROM-CACHE")}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, fromCache: ++this.taskStat.fromCache };
		this.renderer.schedule();
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.red(CROSS)} Task ${c.bold(task.name)} ${c.red("FAILED")} ${formatTime(task.result.duration ?? 0)}`);
		this.taskStat = { ...this.taskStat, failed: ++this.taskStat.failed, running: --this.taskStat.running };
		this.renderer.schedule();
	}

	public async onTaskCanceled(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.yellow(CROSS)} Task ${c.bold(task.name)} ${c.yellow("CANCELED")}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, canceled: ++this.taskStat.canceled };
		this.renderer.schedule();
	}

	public async onTasksScheduled(tasks: string[]) {
		this.nadle.logger.info(`Scheduled tasks: ${tasks.join(", ")}`);
		this.taskStat = { ...this.taskStat, scheduled: tasks.length };
		this.renderer.schedule();
	}

	public onExecutionStart() {
		this.startTimers();

		const { minWorkers, maxWorkers, projectDir, configFile } = this.nadle.options;

		if (!this.nadle.options.isWorkerThread) {
			this.nadle.logger.log(c.bold(c.cyan(`🛠️ Welcome to Nadle v${Nadle.version}!`)));
			this.nadle.logger.log(`Using Nadle from ${fileURLToPath(import.meta.resolve("nadle"))}`);
			this.nadle.logger.log(`Loaded configuration from ${configFile}\n`);
			this.nadle.logger.info(
				`Using ${minWorkers === maxWorkers ? minWorkers : `${minWorkers}–${maxWorkers}`} worker${maxWorkers > 1 ? "s" : ""} for task execution`
			);
			this.nadle.logger.info(`Project directory: ${projectDir}`);
			this.nadle.logger.info("Resolved options:", JSON.stringify(this.nadle.options, null, 2));
			this.nadle.logger.info("Detected environments:", { CI: isCI, TEST: isTest });
			this.nadle.logger.info("Execution started");
		}

		this.renderer.start();
	}

	public async onExecutionFinish() {
		this.nadle.logger.info("Execution finished");
		this.renderer.finish();
		clearInterval(this.durationInterval);

		if (this.nadle.options.summary) {
			this.nadle.logger.log(
				renderProfilingSummary({
					totalDuration: this.duration,
					tasks: this.nadle.registry.getAll().flatMap((task) => {
						if (task.status !== TaskStatus.Finished) {
							return [];
						}

						return {
							name: task.name,
							duration: task.result.duration ?? 0
						};
					})
				})
			);
		}

		const print = (count: number) => `${c.bold(count)} task${count > 1 ? "s" : ""}`;

		this.nadle.logger.log(`\n${c.bold(c.green("RUN SUCCESSFUL"))} in ${c.bold(formatTime(this.duration))}`);
		this.nadle.logger.log(
			new StringBuilder()
				.add(`${print(this.taskStat.finished)} executed`)
				.add(this.taskStat.upToDate > 0 && `${print(this.taskStat.upToDate)} up-to-date`)
				.add(this.taskStat.fromCache > 0 && `${print(this.taskStat.fromCache)} restored from cache`)
				.build()
		);
	}

	public async onExecutionFailed(error: any) {
		this.nadle.logger.info("Execution failed");
		this.renderer.finish();
		clearInterval(this.durationInterval);

		const finishedTasks = `${c.bold(this.taskStat.finished)} task${this.taskStat.finished > 1 ? "s" : ""}`;
		const failedTasks = `${c.bold(this.taskStat.failed)} task${this.taskStat.failed > 1 ? "s" : ""}`;

		this.nadle.logger.log(
			`\n${c.bold(c.red("RUN FAILED"))} in ${c.bold(formatTime(this.duration))} ${c.dim(`(${finishedTasks} executed, ${failedTasks} failed)`)}`
		);

		if (!this.nadle.options.stacktrace) {
			this.nadle.logger.log(
				`\nFor more details, re-run the command with the ${c.yellow("--stacktrace")} option to display the full error and help identify the root cause.`
			);
		} else {
			this.nadle.logger.error(error instanceof Error ? error.stack : error);
		}
	}

	private startTimers() {
		const start = performance.now();

		this.durationInterval = setInterval(() => {
			this.currentTime = performance.now();
			this.duration = this.currentTime - start;
		}, DURATION_UPDATE_INTERVAL_MS).unref();
	}
}
