import { vi } from "vitest";

import { TaskScheduler } from "../../../src/core/engine/task-scheduler.js";
import { type SchedulerTask, type SchedulerDependencies } from "../../../src/core/engine/scheduler-types.js";

export type TaskDef = {
	name: string;
	workspaceId?: string;
	dependsOn?: string | string[];
};

export function toTaskId(name: string, workspaceId = "root") {
	if (workspaceId === "root") {
		return name;
	}

	return `${workspaceId}:${name}`;
}

export interface MockOptions {
	parallel?: boolean;
	mainTasks?: string[];
	mainTaskIds?: string[];
	excludedTasks?: string[];
	implicitDependencies?: boolean;
	workspaceDeps?: Record<string, string[]>;
}

export function createMockDeps(tasks: TaskDef[], options?: MockOptions): SchedulerDependencies {
	const taskMap = new Map<string, SchedulerTask>();

	for (const task of tasks) {
		const workspaceId = task.workspaceId ?? "root";
		const id = toTaskId(task.name, workspaceId);

		taskMap.set(id, {
			id,
			workspaceId,
			name: task.name,
			configResolver: () => ({ dependsOn: task.dependsOn })
		});
	}

	const mainTaskDefs = options?.mainTasks ? tasks.filter((t) => options.mainTasks!.includes(t.name)) : tasks;
	const workspaceDeps = options?.workspaceDeps ?? {};

	const resolvedTasks = options?.mainTaskIds
		? options.mainTaskIds.map((id) => ({ taskId: id, rawInput: id, corrected: false }))
		: mainTaskDefs.map((t) => {
				const wid = t.workspaceId ?? "root";

				return { rawInput: t.name, corrected: false, taskId: toTaskId(t.name, wid) };
			});

	return {
		logger: {
			debug: vi.fn(),
			error: vi.fn()
		},
		isRootWorkspace: (workspaceId: string) => workspaceId === "root",
		getWorkspaceDependencies: (wsId: string) => workspaceDeps[wsId] ?? [],
		getTasksByName: (taskName: string) => [...taskMap.values()].filter((t) => t.name === taskName),
		parseTaskRef: (input: string, workspaceId: string) => {
			if (input.includes(":")) {
				return input;
			}

			return toTaskId(input, workspaceId);
		},
		getTaskById: (taskId: string) => {
			const task = taskMap.get(taskId);

			if (!task) {
				throw new Error(`Task ${taskId} not found`);
			}

			return task;
		},
		options: {
			tasks: resolvedTasks,
			parallel: options?.parallel ?? false,
			implicitDependencies: options?.implicitDependencies ?? false,
			excludedTasks: (options?.excludedTasks ?? []).map((id) => ({ taskId: id, rawInput: id, corrected: false }))
		}
	};
}

/**
 * Picks which of the currently-runnable tasks finishes next. Lets a test
 * simulate different task completion timings without touching scheduler
 * internals.
 */
export type CompletionPolicy = (runnable: string[]) => string;

export const policies = {
	/** First-ready finishes first. */
	fifo: (runnable: string[]) => runnable[0],
	/** Last-ready finishes first. */
	lifo: (runnable: string[]) => runnable[runnable.length - 1],
	/** Alphabetically last finishes first — a deterministic "reordered" timing. */
	reverseAlpha: (runnable: string[]) => [...runnable].sort().at(-1)!
} satisfies Record<string, CompletionPolicy>;

export interface DriveResult {
	/** Order in which tasks completed. */
	order: string[];
	/** Successive batches of tasks that were runnable at the same time. */
	waves: string[][];
}

/**
 * Drives a scheduler the way the real task pool does: take the ready tasks,
 * "complete" them one at a time per the completion policy, and feed each
 * completion back to discover newly-unblocked tasks. Treats the scheduler as a
 * black box — only its public `getReadyTasks` is used.
 */
export function drive(deps: SchedulerDependencies, policy: CompletionPolicy = policies.fifo): DriveResult {
	const scheduler = new TaskScheduler(deps).init();
	const order: string[] = [];
	const waves: string[][] = [];

	const runnable = [...scheduler.getReadyTasks()];

	waves.push([...runnable]);

	while (runnable.length > 0) {
		const next = policy(runnable);
		const index = runnable.indexOf(next);

		runnable.splice(index, 1);
		order.push(next);

		const unblocked = [...scheduler.getReadyTasks(next)];

		if (unblocked.length > 0) {
			waves.push(unblocked);
			runnable.push(...unblocked);
		}
	}

	return { order, waves };
}

/** True if `before` appears earlier than `after` in the completion order. */
export function ranBefore(order: string[], before: string, after: string): boolean {
	return order.indexOf(before) < order.indexOf(after);
}
