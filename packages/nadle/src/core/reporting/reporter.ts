import Url from "node:url";

import c from "tinyrainbow";
import { isCI, isTest } from "std-env";

import { Nadle } from "../nadle.js";
import { formatTime } from "../utilities/utils.js";
import { type Listener } from "../interfaces/listener.js";
import { StringBuilder } from "../utilities/string-builder.js";
import { FooterRenderer } from "./renderers/footer-renderer.js";
import { renderProfilingSummary } from "./profiling-summary.js";
import { DefaultRenderer } from "./renderers/default-renderer.js";
import { TaskStatus, type RegisteredTask } from "../interfaces/registered-task.js";
import { DASH, CHECK, CROSS, CURVE_ARROW, VERTICAL_BAR } from "../utilities/constants.js";

const DURATION_UPDATE_INTERVAL_MS = 100;

export class DefaultReporter implements Listener {
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

		return this;
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

		for (const runningTask of this.nadle.taskRegistry.getAll().filter((task) => task.status === TaskStatus.Running)) {
			const workerId = this.threadIdPerWorker[runningTask.id];

			lines[workerId - 1] = ` ${c.yellow(">")} :${c.bold(runningTask.id)}`;
			maxWorkerId = Math.max(maxWorkerId, workerId);
		}

		return lines.slice(0, maxWorkerId);
	}

	public async onTaskStart(task: RegisteredTask, threadId: number) {
		this.nadle.logger.log(`${c.yellow(">")} Task ${c.bold(task.label)} ${c.yellow("STARTED")}\n`);
		this.taskStat = { ...this.taskStat, running: ++this.taskStat.running };
		this.threadIdPerWorker = { ...this.threadIdPerWorker, [task.id]: threadId };
		this.renderer.schedule();
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(CHECK)} Task ${c.bold(task.label)} ${c.green("DONE")} ${c.dim(formatTime(task.timing.duration ?? 0))}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, finished: ++this.taskStat.finished };
		this.renderer.schedule();
	}

	public async onTaskUpToDate(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(DASH)} Task ${c.bold(task.label)} ${c.green("UP-TO-DATE")}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, upToDate: ++this.taskStat.upToDate };
		this.renderer.schedule();
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(CURVE_ARROW)} Task ${c.bold(task.label)} ${c.green("FROM-CACHE")}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, fromCache: ++this.taskStat.fromCache };
		this.renderer.schedule();
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.red(CROSS)} Task ${c.bold(task.label)} ${c.red("FAILED")} ${formatTime(task.timing.duration ?? 0)}`);
		this.taskStat = { ...this.taskStat, failed: ++this.taskStat.failed, running: --this.taskStat.running };
		this.renderer.schedule();
	}

	public async onTaskCanceled(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.yellow(CROSS)} Task ${c.bold(task.label)} ${c.yellow("CANCELED")}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, canceled: ++this.taskStat.canceled };
		this.renderer.schedule();
	}

	public async onTasksScheduled(tasks: RegisteredTask[]) {
		this.nadle.logger.info(`Scheduled tasks: ${tasks.map((task) => task.id).join(", ")}`);
		this.taskStat = { ...this.taskStat, scheduled: tasks.length };
		this.renderer.schedule();
	}

	public onExecutionStart() {
		this.startTimers();

		const { project, minWorkers, maxWorkers, configFile } = this.nadle.options;

		const workspaceConfigFileCount = project.workspaces.flatMap((workspace) => workspace.configFilePath ?? []).length;

		if (!this.nadle.options.isWorkerThread) {
			this.nadle.logger.log(c.bold(c.cyan(`🛠️ Welcome to Nadle v${Nadle.version}!`)));
			this.nadle.logger.log(`Using Nadle from ${Url.fileURLToPath(import.meta.resolve("nadle"))}`);
			this.nadle.logger.log(
				`Loaded configuration from ${configFile}${workspaceConfigFileCount > 0 ? ` and ${workspaceConfigFileCount} other(s) files` : ""}\n`
			);
			this.nadle.logger.info(
				`Using ${minWorkers === maxWorkers ? minWorkers : `${minWorkers}–${maxWorkers}`} worker${maxWorkers > 1 ? "s" : ""} for task execution`
			);
			this.nadle.logger.info(`Project directory: ${project.rootWorkspace.absolutePath}`);
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
					tasks: this.nadle.taskRegistry.getAll().flatMap((task) => {
						if (task.status !== TaskStatus.Finished) {
							return [];
						}

						return { label: task.label, duration: task.timing.duration ?? 0 };
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
