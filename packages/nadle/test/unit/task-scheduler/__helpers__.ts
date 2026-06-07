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

/**
 * Deterministic PRNG (mulberry32). Seeded so randomized tests are fully
 * reproducible — `Math.random` is unavailable in this codebase and would make
 * failures impossible to replay.
 */
export function createRng(seed: number): () => number {
	let state = seed >>> 0;

	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Deterministic pseudo-random durations (1..100) for a fixed set of task ids,
 * derived from a seed. Lets a known-shape graph be exercised under many
 * different but reproducible timing profiles.
 */
export function randomDurations(seed: number, taskIds: string[]): Record<string, number> {
	const rng = createRng(seed);
	const durations: Record<string, number> = {};

	for (const id of taskIds) {
		durations[id] = 1 + Math.floor(rng() * 100);
	}

	return durations;
}

/** A handful of fixed seeds to sweep a known graph across timing profiles. */
export const SEEDS = [1, 7, 42, 99, 123, 777, 2024, 31337];

export interface RandomDag {
	tasks: TaskDef[];
	/** All [dependency, dependent] edges in the generated graph. */
	edges: Array<[string, string]>;
	/** A deterministic duration per task. */
	durations: Record<string, number>;
}

/**
 * Builds a random but acyclic task graph from a seed. The graph stays acyclic
 * because dependencies are only ever drawn from lower-indexed tasks. Each task also
 * gets a deterministic pseudo-random duration.
 */
export function generateRandomDag(seed: number, taskCount: number, maxDepsPerTask = 3): RandomDag {
	const rng = createRng(seed);
	const names = Array.from({ length: taskCount }, (_, i) => `t${i}`);
	const tasks: TaskDef[] = [];
	const edges: Array<[string, string]> = [];
	const durations: Record<string, number> = {};

	for (let i = 0; i < taskCount; i++) {
		const name = names[i];

		durations[name] = 1 + Math.floor(rng() * 100);

		const dependsOn: string[] = [];

		if (i > 0) {
			const depCount = Math.floor(rng() * Math.min(maxDepsPerTask, i + 1));

			for (let d = 0; d < depCount; d++) {
				const depIndex = Math.floor(rng() * i); // strictly lower index -> acyclic
				const dep = names[depIndex];

				if (!dependsOn.includes(dep)) {
					dependsOn.push(dep);
					edges.push([dep, name]);
				}
			}
		}

		tasks.push(dependsOn.length > 0 ? { name, dependsOn } : { name });
	}

	return { tasks, edges, durations };
}

export interface ClockDriveResult {
	/** Order in which tasks completed (by simulated finish time). */
	order: string[];
	/** Max concurrent in-flight tasks observed. */
	peakConcurrency: number;
	/** Map of taskId -> { start, end } on the simulated clock. */
	timeline: Map<string, { end: number; start: number }>;
}

/**
 * Drives the scheduler with an explicit duration per task on a simulated clock,
 * modelling a real concurrent pool: every runnable task starts immediately and
 * runs for its duration; whichever is due next on the clock completes first,
 * which unblocks its dependents (started at that clock time). This makes task
 * runtime — not just completion order — drive the schedule, so a long task
 * offered first can finish after a short task offered later.
 *
 * Duration defaults to 1 for any task not listed.
 */
export function driveWithDurations(deps: SchedulerDependencies, durations: Record<string, number>): ClockDriveResult {
	const scheduler = new TaskScheduler(deps).init();
	const order: string[] = [];
	const timeline = new Map<string, { end: number; start: number }>();

	// in-flight tasks keyed by id -> finish time on the clock
	const inFlight = new Map<string, number>();
	let clock = 0;
	let peakConcurrency = 0;

	const start = (taskId: string) => {
		const duration = durations[taskId] ?? 1;

		timeline.set(taskId, { start: clock, end: clock + duration });
		inFlight.set(taskId, clock + duration);
		peakConcurrency = Math.max(peakConcurrency, inFlight.size);
	};

	for (const taskId of scheduler.getReadyTasks()) {
		start(taskId);
	}

	while (inFlight.size > 0) {
		// advance the clock to the next task that finishes (ties: lexicographic)
		let nextId = "";
		let nextEnd = Infinity;

		for (const [id, end] of inFlight) {
			if (end < nextEnd || (end === nextEnd && id < nextId)) {
				nextEnd = end;
				nextId = id;
			}
		}

		clock = nextEnd;
		inFlight.delete(nextId);
		order.push(nextId);

		for (const unblocked of scheduler.getReadyTasks(nextId)) {
			start(unblocked);
		}
	}

	return { order, timeline, peakConcurrency };
}
