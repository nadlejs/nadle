import { type Project, getWorkspaceById, getWorkspaceByLabelOrId } from "@nadle/project-resolver";

import { Messages } from "../utilities/messages.js";
import { TaskIdentifier } from "../models/task-identifier.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";

interface BufferedTask extends Omit<RegisteredTask, "label"> {}

export class TaskRegistry {
	private readonly registry = new Map<TaskIdentifier, RegisteredTask>();
	private readonly nameIndex = new Map<string, RegisteredTask[]>();
	/**
	 * The id of the workspace where tasks are registering.
	 */
	public workspaceId: string | null = null;
	private readonly buffer = new Map<TaskIdentifier, BufferedTask>();

	#project: Project | null = null;

	public onConfigureWorkspace(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public configure(project: Project) {
		this.#project = project;

		for (const bufferedTask of this.buffer.values()) {
			const { id, name, workspaceId } = bufferedTask;
			const workspaceLabel = getWorkspaceById(project, workspaceId).label;
			const task = { ...bufferedTask, label: TaskIdentifier.create(workspaceLabel, name) };

			this.registry.set(id, task);

			const existing = this.nameIndex.get(name);

			if (existing) {
				existing.push(task);
			} else {
				this.nameIndex.set(name, [task]);
			}
		}

		this.buffer.clear();
	}

	public register(task: Omit<RegisteredTask, "id" | "label" | "workspaceId">) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set.");
		}

		const id = TaskIdentifier.create(this.workspaceId, task.name);

		this.buffer.set(id, { ...task, id, workspaceId: this.workspaceId });
	}

	public hasTaskName(taskName: string) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set.");
		}

		return this.buffer.has(TaskIdentifier.create(this.workspaceId, taskName));
	}

	public get tasks(): RegisteredTask[] {
		return [...this.registry.values()];
	}

	public getTaskNameByWorkspace(targetWorkspaceId: string): string[] {
		return this.tasks.flatMap(({ name, workspaceId }) => (targetWorkspaceId === workspaceId ? [name] : []));
	}

	public getTaskByName(taskName: string): RegisteredTask[] {
		return this.nameIndex.get(taskName) ?? [];
	}

	public parse(taskInput: string, targetWorkspaceId: string): TaskIdentifier {
		const { taskNameInput, workspaceInput } = TaskIdentifier.parser(taskInput);
		const targetWorkspace =
			workspaceInput === undefined ? getWorkspaceById(this.project, targetWorkspaceId) : getWorkspaceByLabelOrId(this.project, workspaceInput);
		const taskId = TaskIdentifier.create(targetWorkspace.id, taskNameInput);

		if (!this.registry.has(taskId)) {
			throw new Error(Messages.UnresolvedTaskWithoutSuggestions(taskNameInput, targetWorkspace.label));
		}

		return taskId;
	}

	public getTaskById(taskId: TaskIdentifier): RegisteredTask {
		const task = this.registry.get(taskId);

		if (!task) {
			throw new Error(`Task ${taskId} not found`);
		}

		return task;
	}

	private get project(): Project {
		if (this.#project === null) {
			throw new Error("Project is not configured yet.");
		}

		return this.#project;
	}
}
