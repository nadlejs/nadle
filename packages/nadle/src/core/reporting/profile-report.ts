import c from "tinyrainbow";

import { formatTime } from "../utilities/utils.js";
import { type ExecutionContext } from "../context.js";
import { TaskStatus } from "../interfaces/registered-task.js";
import { type ExecutionTracker } from "../models/execution-tracker.js";

namespace ProfileReport {
	export interface CriticalPath {
		/** Summed wall-clock of the path. */
		readonly duration: number;
		/** Task labels from the root down to the leaf that bounded the run. */
		readonly path: readonly string[];
	}

	export interface Hotspot {
		readonly label: string;
		readonly duration: number;
		readonly suggestion: string;
	}

	export interface Props {
		readonly hotspots: readonly Hotspot[];
		readonly criticalPath: CriticalPath | null;
	}
}

interface CriticalPathInput {
	/** Requested (expanded) root task ids. */
	readonly roots: readonly string[];
	/** Display label of a task. */
	readonly getLabel: (taskId: string) => string;
	/** Wall-clock of a task (0 for tasks that did not execute). */
	readonly getDuration: (taskId: string) => number;
	/** Direct dependency ids of a task. */
	readonly getDependencies: (taskId: string) => Iterable<string>;
}

interface ProfileDataInput extends CriticalPathInput {
	/** True if the task executed (vs cache hit / up-to-date / skipped). */
	readonly didExecute: (taskId: string) => boolean;
	/** True if the task declares both inputs and outputs (so it is cacheable). */
	readonly isCacheable: (taskId: string) => boolean;
}

/**
 * Collect the critical path and cache-miss hotspots from injected scheduler/tracker
 * accessors. Shared by the default and agent reporters so neither duplicates the
 * traversal. The hotspots are the tasks that executed, each with a suggestion.
 */
export function collectProfileData(input: ProfileDataInput): ProfileReport.Props {
	const criticalPath = computeCriticalPath(input);
	const hotspots: ProfileReport.Hotspot[] = [];

	for (const taskId of input.roots) {
		if (!input.didExecute(taskId)) {
			continue;
		}

		hotspots.push({
			label: input.getLabel(taskId),
			duration: input.getDuration(taskId),
			suggestion: input.isCacheable(taskId) ? "cache missed; an input changed" : "not cacheable; declare inputs & outputs to enable caching"
		});
	}

	return { hotspots, criticalPath };
}

/** Build the profile accessors from the live scheduler + tracker. */
export function profileAccessors(context: ExecutionContext, tracker: ExecutionTracker): ProfileDataInput {
	const scheduler = context.taskScheduler;

	return {
		roots: scheduler.scheduledTask,
		getDuration: (taskId) => tracker.getTaskState(taskId).duration ?? 0,
		getDependencies: (taskId) => scheduler.getDirectDependencies(taskId),
		getLabel: (taskId) => context.taskRegistry.getTaskById(taskId).label,
		didExecute: (taskId) => tracker.getTaskStatus(taskId) === TaskStatus.Finished,
		isCacheable: (taskId) => {
			const { inputs, outputs } = context.taskRegistry.getTaskById(taskId).configResolver();

			return inputs !== undefined && outputs !== undefined;
		}
	};
}

/**
 * Longest cumulative-duration dependency chain — the sequence of tasks that bounded
 * the run. Pure; memoized over the dependency graph. Returns labels root → leaf.
 */
export function computeCriticalPath(input: CriticalPathInput): ProfileReport.CriticalPath | null {
	const { roots, getLabel, getDuration, getDependencies } = input;
	const memo = new Map<string, { ids: string[]; duration: number }>();

	const bestFrom = (taskId: string): { ids: string[]; duration: number } => {
		const cached = memo.get(taskId);

		if (cached) {
			return cached;
		}

		let best: { ids: string[]; duration: number } = { ids: [], duration: 0 };

		for (const dep of getDependencies(taskId)) {
			const candidate = bestFrom(dep);

			if (candidate.duration > best.duration) {
				best = candidate;
			}
		}

		const result = { ids: [...best.ids, taskId], duration: best.duration + getDuration(taskId) };
		memo.set(taskId, result);

		return result;
	};

	let overall: { ids: string[]; duration: number } | null = null;

	for (const root of roots) {
		const candidate = bestFrom(root);

		if (overall === null || candidate.duration > overall.duration) {
			overall = candidate;
		}
	}

	if (overall === null || overall.ids.length === 0) {
		return null;
	}

	return { duration: overall.duration, path: overall.ids.map(getLabel) };
}

const HOTSPOT_LIMIT = 5;

/** Format the critical path and cache-miss hotspot sections. Pure. */
export function renderProfileReport({ hotspots, criticalPath }: ProfileReport.Props): string {
	const lines: string[] = [];

	if (criticalPath !== null) {
		lines.push("", c.bold(c.green("Critical path")), `  ${criticalPath.path.join(c.dim(" → "))} ${c.dim(`(${formatTime(criticalPath.duration)})`)}`);
	}

	if (hotspots.length > 0) {
		lines.push("", c.bold(c.green("Cache-miss hotspots")));

		for (const hotspot of [...hotspots].sort((a, b) => b.duration - a.duration).slice(0, HOTSPOT_LIMIT)) {
			lines.push(`  ${hotspot.label} ${c.dim(`(${formatTime(hotspot.duration)})`)} — ${c.dim(hotspot.suggestion)}`);
		}
	}

	return lines.join("\n");
}
