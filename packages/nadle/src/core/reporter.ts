import c from "tinyrainbow";
import { isCI, isTest } from "std-env";

import { type Nadle } from "./nadle.js";
import { CHECK, CROSS } from "./constants.js";
import { type Renderer } from "./renderers/renderer.js";
import { formatTime, formatTimeString } from "./utils.js";
import { NormalRenderer } from "./renderers/normal-renderer.js";
import { SummaryRenderer } from "./renderers/summary-renderer.js";
import { TaskStatus, type Awaitable, type RegisteredTask } from "./types.js";

export interface Reporter {
	onInit?: () => void;

	onExecutionStart?: () => Awaitable<void>;
	onExecutionFinish?: () => Awaitable<void>;
	onExecutionFailed?: () => Awaitable<void>;

	onTaskStart?: (task: RegisteredTask) => Awaitable<void>;
	onTaskQueued?: (task: RegisteredTask) => Awaitable<void>;
	onTaskFinish?: (task: RegisteredTask) => Awaitable<void>;
	onTaskFailed?: (task: RegisteredTask) => Awaitable<void>;
}

const DURATION_UPDATE_INTERVAL_MS = 100;

export class DefaultReporter implements Reporter {
	private renderer: Renderer;
	private taskStat = {
		failed: 0,
		queued: 0,
		running: 0,
		finished: 0
	};
	private startTime = "";
	private currentTime = 0;
	private duration = 0;
	private durationInterval: NodeJS.Timeout | undefined = undefined;

	constructor(public readonly nadle: Nadle) {
		this.renderer = this.nadle.options.showSummary
			? new SummaryRenderer({ logger: this.nadle.logger, getWindow: () => this.createSummary() })
			: new NormalRenderer();
	}

	private printLabel(label: string) {
		return c.dim(label.padEnd(11, " "));
	}

	private createSummary() {
		const summary: string[] = [""];

		const stats = [
			c.bold(c.blue(`${this.taskStat.queued} queued`)),
			c.bold(c.yellow(`${this.taskStat.running} running`)),
			c.bold(c.green(`${this.taskStat.finished} finished`))
		];

		summary.push(`${this.printLabel("Tasks")} ${stats.join(", ")}`);
		summary.push(`${this.printLabel("Start at")} ${this.startTime}`);
		summary.push(`${this.printLabel("Duration")} ${formatTime(this.duration)}`);

		summary.push(...this.printRunningTasks());

		summary.push("");

		return summary;
	}

	private printRunningTasks() {
		return this.nadle.registry
			.getAll()
			.filter((task) => task.status === TaskStatus.Running)
			.map((task) => c.bold(` ${c.yellow(">")} :${task.name}`));
	}

	onInit() {
		if (!this.nadle.options.isWorkerThread) {
			this.nadle.logger.info("Nadle initialized with options:", this.nadle.options);
			this.nadle.logger.info("Detected environments:", { CI: isCI, TEST: isTest });
		}

		this.renderer.start();
	}

	async onTaskStart(task: RegisteredTask) {
		this.nadle.logger.log(`${c.yellow(">")} Task ${c.bold(task.name)} started`);
		this.taskStat = { ...this.taskStat, running: ++this.taskStat.running };
		this.renderer.schedule();
	}

	async onTaskFinish(task: RegisteredTask) {
		this.nadle.logger.log(`${c.green(CHECK)} Task ${c.bold(task.name)} done in ${formatTime(task.result.duration ?? 0)}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, finished: ++this.taskStat.finished };
		this.renderer.schedule();
	}

	async onTaskFailed(task: RegisteredTask) {
		this.nadle.logger.log(`${c.red(CROSS)} Task ${c.bold(task.name)} failed in ${formatTime(task.result.duration ?? 0)}`);
		this.taskStat = { ...this.taskStat, failed: ++this.taskStat.failed, running: --this.taskStat.running };
		this.renderer.schedule();
	}

	async onTaskQueued(task: RegisteredTask) {
		this.nadle.logger.info(`Task ${c.bold(task.name)} queued`);
		this.taskStat = { ...this.taskStat, queued: ++this.taskStat.queued };
		this.renderer.schedule();
	}

	async onExecutionStart() {
		this.nadle.logger.info("Execution started");
		this.startTimers();
		this.renderer.start();
	}

	async onExecutionFinish() {
		this.nadle.logger.info("Execution finished");
		this.renderer.finish();
		clearInterval(this.durationInterval);

		const finishedTasks = `${c.bold(this.taskStat.finished)} task${this.taskStat.finished > 1 ? "s" : ""}`;

		this.nadle.logger.log(`\n${c.bold(c.green("RUN SUCCESSFUL"))} in ${c.bold(formatTime(this.duration))} ${c.dim(`(${finishedTasks} executed)`)}`);
	}

	async onExecutionFailed() {
		this.nadle.logger.info("Execution failed");
		this.renderer.finish();
		clearInterval(this.durationInterval);

		const finishedTasks = `${c.bold(this.taskStat.finished)} task${this.taskStat.finished > 1 ? "s" : ""}`;
		const failedTasks = `${c.bold(this.taskStat.failed)} task${this.taskStat.failed > 1 ? "s" : ""}`;

		this.nadle.logger.log(
			`\n${c.bold(c.red("RUN FAILED"))} in ${c.bold(formatTime(this.duration))} ${c.dim(`(${finishedTasks} executed, ${failedTasks} failed)`)}`
		);
	}

	private startTimers() {
		const start = performance.now();
		this.startTime = formatTimeString(new Date());

		this.durationInterval = setInterval(() => {
			this.currentTime = performance.now();
			this.duration = this.currentTime - start;
		}, DURATION_UPDATE_INTERVAL_MS).unref();
	}
}
