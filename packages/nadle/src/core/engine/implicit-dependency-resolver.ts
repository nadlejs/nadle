import { type SchedulerDependencies } from "./scheduler-types.js";
import { type TaskIdentifier } from "../models/task-identifier.js";

type ResolverDeps = Pick<SchedulerDependencies, "getTasksByName" | "getWorkspaceDependencies" | "logger"> & {
	excludedTaskIds: ReadonlySet<TaskIdentifier>;
};

/**
 * Resolves implicit task dependencies based on workspace dependency relationships.
 *
 * For a given task, finds all upstream workspaces and checks if they define
 * a task with the same name. If so, an implicit dependency edge is created.
 */
export function resolveImplicitDependencies(taskName: string, workspaceId: string, deps: ResolverDeps): Set<TaskIdentifier> {
	const implicitDeps = new Set<TaskIdentifier>();
	const upstreamWorkspaceIds = deps.getWorkspaceDependencies(workspaceId);

	for (const upstreamWorkspaceId of upstreamWorkspaceIds) {
		const sameNameTasks = deps.getTasksByName(taskName);
		const upstreamTask = sameNameTasks.find((task) => task.workspaceId === upstreamWorkspaceId);

		if (!upstreamTask || deps.excludedTaskIds.has(upstreamTask.id)) {
			continue;
		}

		deps.logger.debug({ tag: "Scheduler" }, `Implicit dependency: ${workspaceId}:${taskName} → ${upstreamTask.id}`);
		implicitDeps.add(upstreamTask.id);
	}

	return implicitDeps;
}
