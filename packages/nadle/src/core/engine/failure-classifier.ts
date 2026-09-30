import { type ExecutionContext } from "../context.js";
import { type TaskIdentifier } from "../models/task-identifier.js";
import { type NonExecutedCounts } from "../reporting/run-summary.js";

export interface FailureClassifierInput {
	/** Tasks that failed during the run. */
	readonly failedTaskIds: ReadonlySet<TaskIdentifier>;
	/** Tasks scheduled for the run that never reached a terminal status. */
	readonly nonExecutedTaskIds: readonly TaskIdentifier[];
	/** Full transitive dependency closure of a task, as the scheduler computed it. */
	readonly getTransitiveDependencies: (taskId: TaskIdentifier) => Iterable<TaskIdentifier>;
}

export interface NonExecutedTasks {
	/** At least one task in the transitive dependency closure failed. */
	readonly blocked: TaskIdentifier[];
	/** No failure anywhere in the closure; the run ended before the task ran. */
	readonly notStarted: TaskIdentifier[];
}

/**
 * Partitions tasks that never ran into blocked and not-started. The two sets are
 * mutually exclusive and jointly exhaustive — see spec/03-scheduling.md.
 */
export function classifyNonExecutedTasks(input: FailureClassifierInput): NonExecutedTasks {
	const { failedTaskIds, nonExecutedTaskIds, getTransitiveDependencies } = input;

	const blocked: TaskIdentifier[] = [];
	const notStarted: TaskIdentifier[] = [];

	for (const taskId of nonExecutedTaskIds) {
		if (hasFailureInClosure(taskId, failedTaskIds, getTransitiveDependencies)) {
			blocked.push(taskId);
		} else {
			notStarted.push(taskId);
		}
	}

	return { blocked, notStarted };
}

/** True if the task's transitive dependency closure holds at least one failure. */
export function hasFailureInClosure(
	taskId: TaskIdentifier,
	failedTaskIds: ReadonlySet<TaskIdentifier>,
	getTransitiveDependencies: (taskId: TaskIdentifier) => Iterable<TaskIdentifier>
): boolean {
	if (failedTaskIds.size === 0) {
		return false;
	}

	for (const dependencyId of getTransitiveDependencies(taskId)) {
		if (failedTaskIds.has(dependencyId)) {
			return true;
		}
	}

	return false;
}

/** Joins tracker state with the scheduler graph to size the two non-executed counts. */
export function countNonExecuted(context: ExecutionContext): NonExecutedCounts {
	const tracker = context.executionTracker;

	const { blocked, notStarted } = classifyNonExecutedTasks({
		failedTaskIds: tracker.failedTaskIds,
		nonExecutedTaskIds: tracker.nonExecutedTaskIds,
		getTransitiveDependencies: (taskId) => context.taskScheduler.getTransitiveDependencies(taskId)
	});

	return { blocked: blocked.length, notStarted: notStarted.length };
}
