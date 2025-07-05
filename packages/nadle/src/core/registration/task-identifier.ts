import { COLON } from "../utilities/constants.js";
import { Project } from "../options/project-resolver.js";

export type TaskIdentifier = string;

export namespace TaskIdentifier {
	const SEPARATOR = COLON;

	export function resolveDependentTasks(hostTaskId: TaskIdentifier, dependencyTaskNames: string[]) {
		const currentWorkspaceId = resolve(hostTaskId).workspaceId;

		return dependencyTaskNames.map((taskName) => {
			if (taskName.includes(SEPARATOR)) {
				return taskName;
			}

			return TaskIdentifier.create(currentWorkspaceId, taskName);
		});
	}

	export function create(workspaceId: string, taskName: string): TaskIdentifier {
		return [...workspaceId.split(SEPARATOR), taskName].join(SEPARATOR);
	}

	function resolve(taskIdentifier: TaskIdentifier): { taskName: string; workspaceId: string } {
		const parts = taskIdentifier.split(SEPARATOR);

		if (parts.length < 2) {
			throw new Error(`Invalid task identifier: ${taskIdentifier}`);
		}

		return { taskName: parts[parts.length - 1], workspaceId: parts.slice(0, -1).join(SEPARATOR) };
	}

	export function normalize(taskName: string) {
		if (taskName.includes(SEPARATOR)) {
			return taskName;
		}

		return create(Project.ROOT_WORKSPACE_ID, taskName);
	}

	export function getLabel(taskIdentifier: TaskIdentifier): string {
		const { taskName, workspaceId } = resolve(taskIdentifier);

		if (workspaceId === Project.ROOT_WORKSPACE_ID) {
			return taskName;
		}

		return taskIdentifier;
	}
}
