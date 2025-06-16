import { fileURLToPath } from "node:url";

import c from "tinyrainbow";
import { isCI, isTest } from "std-env";

import { type Nadle } from "./nadle.js";
import { type Renderer } from "./renderers/renderer.js";
import { formatTime, formatTimeString } from "./utils.js";
import { CHECK, CROSS, VERTICAL_BAR } from "./constants.js";
import { NormalRenderer } from "./renderers/normal-renderer.js";
import { SummaryRenderer } from "./renderers/summary-renderer.js";
import { TaskStatus, type Awaitable, type RegisteredTask } from "./types.js";

export interface Reporter {
	onInit?: () => void;

	onExecutionStart?: () => Awaitable<void>;
	onExecutionFinish?: () => Awaitable<void>;
	onExecutionFailed?: (error: any) => Awaitable<void>;

	onTasksScheduled?: (tasks: string[]) => Awaitable<void>;
	onTaskFinish?: (task: RegisteredTask) => Awaitable<void>;
	onTaskFailed?: (task: RegisteredTask) => Awaitable<void>;
	onTaskStart?: (task: RegisteredTask, threadId: number) => Awaitable<void>;
}

const DURATION_UPDATE_INTERVAL_MS = 100;

export class DefaultReporter implements Reporter {
	private readonly renderer: Renderer;
	private taskStat = {
		failed: 0,
		running: 0,
		finished: 0,
		scheduled: 0
	};
	private threadIdPerWorker: Record<string, number> = {};
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
			c.cyanBright(`${this.taskStat.scheduled - this.taskStat.running - this.taskStat.finished - this.taskStat.failed} pending`),
			c.yellow(`${this.taskStat.running} running`),
			c.green(`${this.taskStat.finished} finished`)
		].join(` ${c.gray(VERTICAL_BAR)} `);

		summary.push([this.printLabel("Tasks"), stats, c.dim(`(${this.taskStat.scheduled} scheduled)`)].join(" "));
		summary.push([this.printLabel("Duration"), formatTime(this.duration)].join(" "));

		summary.push(...this.printRunningTasks());

		summary.push("");

		return summary;
	}

	private printRunningTasks() {
		const lines = Array.from({ length: this.nadle.options.maxWorkers }, () => ` ${c.yellow(">")} ${c.dim("IDLE")}`);

		for (const runningTask of this.nadle.registry.getAll().filter((task) => task.status === TaskStatus.Running)) {
			lines[this.threadIdPerWorker[runningTask.name] - 1] = ` ${c.yellow(">")} :${c.bold(runningTask.name)}`;
		}

		return lines;
	}

	onInit() {
		const { minWorkers, maxWorkers, configPath, projectDir } = this.nadle.options;

		if (!this.nadle.options.isWorkerThread) {
			this.nadle.logger.log(c.bold(c.cyan(`🛠️ Welcome to Nadle v${this.nadle.version}!`)));
			this.nadle.logger.info(`Using Nadle from: ${fileURLToPath(import.meta.resolve("nadle"))}`);
			this.nadle.logger.debug(`Project dir: ${projectDir}`);
			this.nadle.logger.log(c.dim(`Loading configuration file from: ${configPath}`));
			this.nadle.logger.log(
				c.dim(`Using ${minWorkers === maxWorkers ? minWorkers : `${minWorkers}–${maxWorkers}`} worker${maxWorkers > 1 ? "s" : ""} for task execution`)
			);
			this.nadle.logger.info("Resolved options:", this.nadle.options);
			this.nadle.logger.info("Detected environments:", { CI: isCI, TEST: isTest });
		}

		this.renderer.start();
	}

	async onTaskStart(task: RegisteredTask, threadId: number) {
		this.nadle.logger.log(`${c.yellow(">")} Task ${c.bold(task.name)} started\n`);
		this.taskStat = { ...this.taskStat, running: ++this.taskStat.running };
		this.threadIdPerWorker = { ...this.threadIdPerWorker, [task.name]: threadId };
		this.renderer.schedule();
	}

	async onTaskFinish(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.green(CHECK)} Task ${c.bold(task.name)} done in ${formatTime(task.result.duration ?? 0)}`);
		this.taskStat = { ...this.taskStat, running: --this.taskStat.running, finished: ++this.taskStat.finished };
		this.renderer.schedule();
	}

	async onTaskFailed(task: RegisteredTask) {
		this.nadle.logger.log(`\n${c.red(CROSS)} Task ${c.bold(task.name)} failed in ${formatTime(task.result.duration ?? 0)}`);
		this.taskStat = { ...this.taskStat, failed: ++this.taskStat.failed, running: --this.taskStat.running };
		this.renderer.schedule();
	}

	async onTasksScheduled(tasks: string[]) {
		this.nadle.logger.info(`Scheduled tasks: ${tasks.join(", ")}`);
		this.taskStat = { ...this.taskStat, scheduled: tasks.length };
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

	async onExecutionFailed(error: any) {
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
		this.startTime = formatTimeString(new Date());

		this.durationInterval = setInterval(() => {
			this.currentTime = performance.now();
			this.duration = this.currentTime - start;
		}, DURATION_UPDATE_INTERVAL_MS).unref();
	}
}
