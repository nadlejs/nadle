import { formatTime } from "../utilities/utils.js";
import { type ExecutionContext } from "../context.js";
import { type Listener } from "../interfaces/listener.js";
import { StringBuilder } from "../utilities/string-builder.js";
import { TaskStatus, type RegisteredTask } from "../interfaces/registered-task.js";
import { type TaskStats, type ExecutionTracker } from "../models/execution-tracker.js";

/**
 * Compact, plain-text reporter for AI agents and scripts. No colors, no
 * spinners, no footer, no banner — one stable line per task outcome and a
 * single machine-readable summary line at the end.
 */
export class AgentReporter implements Listener {
	private readonly tracker: ExecutionTracker;

	public constructor(private readonly context: ExecutionContext) {
		this.tracker = this.context.executionTracker;
	}

	private duration(task: RegisteredTask): string {
		return formatTime(this.tracker.getTaskState(task.id).duration ?? 0);
	}

	public async onTaskFinish(task: RegisteredTask) {
		this.context.logger.log(`DONE ${task.label} ${this.duration(task)}`);
	}

	public async onTaskUpToDate(task: RegisteredTask) {
		this.context.logger.log(`UP-TO-DATE ${task.label}`);
	}

	public async onTaskRestoreFromCache(task: RegisteredTask) {
		this.context.logger.log(`FROM-CACHE ${task.label}`);
	}

	public async onTaskFailed(task: RegisteredTask) {
		this.context.logger.log(`FAILED ${task.label} ${this.duration(task)}`);
		this.context.logger.log(`REPRO nadle ${task.label}`);
	}

	public async onTaskCanceled(task: RegisteredTask) {
		this.context.logger.log(`CANCELED ${task.label}`);
	}

	public onExecutionFinish() {
		if (this.context.options.showConfig) {
			return;
		}

		this.context.logger.log(this.summaryLine("SUCCESS"));
	}

	public onExecutionFailed(error: unknown) {
		this.context.logger.log(this.summaryLine("FAILED"));

		if (this.context.options.stacktrace) {
			this.context.logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
		}
	}

	private summaryLine(result: "SUCCESS" | "FAILED"): string {
		const counts = new StringBuilder(" ")
			.add(`done ${this.stats[TaskStatus.Finished]}`)
			.add(this.stats[TaskStatus.UpToDate] > 0 && `up-to-date ${this.stats[TaskStatus.UpToDate]}`)
			.add(this.stats[TaskStatus.FromCache] > 0 && `cached ${this.stats[TaskStatus.FromCache]}`)
			.add(this.stats[TaskStatus.Failed] > 0 && `failed ${this.stats[TaskStatus.Failed]}`)
			.add(this.tracker.skippedCount > 0 && `skipped ${this.tracker.skippedCount}`)
			.build();

		return `${result} in ${formatTime(this.tracker.duration)} (${counts})`;
	}

	private get stats(): TaskStats {
		return this.tracker.taskStats;
	}
}
