import { type Nadle } from "../nadle.js";
import { COLON } from "../utilities/constants.js";
import { Project } from "../options/project-resolver.js";

type TaskIdentifier = string;

export class TaskIdentifierResolver {
	private static readonly SEPARATOR = COLON;
	public constructor(private readonly nadle: Nadle) {}

	public resolveDependentTasks(hostTaskId: TaskIdentifier, dependencyTaskNames: string[]) {
		const currentWorkspaceId = TaskIdentifierResolver.resolve(hostTaskId).workspaceId;

		return dependencyTaskNames.map((taskName) => {
			if (taskName.includes(TaskIdentifierResolver.SEPARATOR)) {
				return taskName;
			}

			return TaskIdentifierResolver.create(currentWorkspaceId, taskName);
		});
	}

	public static create(workspaceId: string, taskName: string): TaskIdentifier {
		return [...workspaceId.split(TaskIdentifierResolver.SEPARATOR), taskName].join(TaskIdentifierResolver.SEPARATOR);
	}

	private static resolve(taskIdentifier: TaskIdentifier): { taskName: string; workspaceId: string } {
		const parts = taskIdentifier.split(TaskIdentifierResolver.SEPARATOR);

		if (parts.length < 2) {
			throw new Error(`Invalid task identifier: ${taskIdentifier}`);
		}

		return { taskName: parts[parts.length - 1], workspaceId: parts.slice(0, -1).join(TaskIdentifierResolver.SEPARATOR) };
	}

	public static normalize(taskName: string) {
		if (taskName.includes(TaskIdentifierResolver.SEPARATOR)) {
			return taskName;
		}

		return this.create(Project.ROOT_WORKSPACE_ID, taskName);
	}

	public static getDisplayName(taskIdentifier: TaskIdentifier): string {
		const { taskName, workspaceId } = TaskIdentifierResolver.resolve(taskIdentifier);

		if (workspaceId === Project.ROOT_WORKSPACE_ID) {
			return taskName;
		}

		return taskIdentifier;
	}
}
