/**
 * Contract definitions for the refactored TaskScheduler.
 *
 * These interfaces define the dependency injection boundary for the scheduler,
 * enabling pure unit testing without mocking the full ProjectContext.
 *
 * NOTE: This is a design contract, not production code. The actual implementation
 * will live in packages/nadle/src/core/engine/scheduler-types.ts.
 */

import type { TaskIdentifier } from "../../packages/nadle/src/core/models/task-identifier.js";

// ---------------------------------------------------------------------------
// Narrow interfaces for scheduler dependencies
// ---------------------------------------------------------------------------

/**
 * Minimal task information needed by the scheduler.
 * Avoids exposing the full RegisteredTask to scheduling logic.
 */
export interface SchedulerTask {
	readonly id: TaskIdentifier;
	readonly name: string;
	readonly workspaceId: string;
	readonly configResolver: () => SchedulerTaskConfig;
}

/**
 * Subset of TaskConfiguration that the scheduler reads.
 */
export interface SchedulerTaskConfig {
	readonly dependsOn?: string | readonly string[];
}

/**
 * Narrow logger contract for the scheduler.
 */
export interface SchedulerLogger {
	debug(...args: unknown[]): void;
	throw(message: string): never;
}

/**
 * Options subset the scheduler needs.
 */
export interface SchedulerOptions {
	readonly parallel: boolean;
	readonly implicitDependencies: boolean;
}

/**
 * The complete set of injectable dependencies for TaskScheduler.
 *
 * In production, the Nadle class satisfies this interface structurally.
 * In tests, a plain object can be constructed with minimal setup.
 */
export interface SchedulerDependencies {
	/** Fetch a task by its full identifier. Throws if not found. */
	getTaskById(taskId: TaskIdentifier): SchedulerTask;

	/** Fetch all tasks registered with the given name (across all workspaces). O(1). */
	getTasksByName(taskName: string): readonly SchedulerTask[];

	/** Resolve a dependency string (e.g., "build", "packages:lib:build") to a TaskIdentifier. */
	parseTaskRef(input: string, targetWorkspaceId: string): TaskIdentifier;

	/** Check whether a workspace ID refers to the root workspace. */
	isRootWorkspace(workspaceId: string): boolean;

	/** Get workspace IDs that the given workspace depends on (from package.json). */
	getWorkspaceDependencies(workspaceId: string): readonly string[];

	/** Narrow logger (debug logging + error throwing). */
	readonly logger: SchedulerLogger;

	/** Scheduler-relevant options. */
	readonly options: SchedulerOptions;
}

// ---------------------------------------------------------------------------
// Implicit dependency resolver contract
// ---------------------------------------------------------------------------

/**
 * Resolves implicit task dependencies for a given task based on workspace
 * dependency relationships.
 *
 * Pure function — no side effects except debug logging via deps.logger.
 *
 * @param taskName - The task name (e.g., "build")
 * @param workspaceId - The workspace that owns this task
 * @param excludedTaskIds - Tasks excluded via --exclude
 * @param deps - Injectable dependencies for lookups
 * @returns Set of TaskIdentifiers that this task implicitly depends on
 */
export type ImplicitDependencyResolver = (
	taskName: string,
	workspaceId: string,
	excludedTaskIds: ReadonlySet<TaskIdentifier>,
	deps: Pick<SchedulerDependencies, "getTasksByName" | "getWorkspaceDependencies" | "logger">
) => Set<TaskIdentifier>;

// ---------------------------------------------------------------------------
// Configure option addition
// ---------------------------------------------------------------------------

/**
 * Extended NadleBaseOptions with the new implicitDependencies field.
 *
 * Added to the existing NadleBaseOptions interface:
 *
 *   readonly implicitDependencies?: boolean;
 *
 * Default: true
 * Configurable via: configure({ implicitDependencies: false })
 * CLI flag: --no-implicit-dependencies (future, not in this feature)
 */
