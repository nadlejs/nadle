import c from "tinyrainbow";

import { Project } from "../models/project/project.js";
import { TaskIdentifier } from "../models/task-identifier.js";
import { type RegisteredTask } from "../interfaces/registered-task.js";

interface BufferedTask extends Omit<RegisteredTask, "label"> {}

export class TaskRegistry {
	private readonly registry = new Map<TaskIdentifier, RegisteredTask>();
	/**
	 * The id of the workspace where tasks are registering.
	 */
	private workspaceId: string | null = null;
	private readonly buffer = new Map<TaskIdentifier, BufferedTask>();

	#project: Project | null = null;

	public onInitializeWorkspace(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public configure(project: Project) {
		this.#project = project;

		for (const bufferedTask of this.buffer.values()) {
			const { id, name, workspaceId } = bufferedTask;
			const workspaceLabel = Project.getWorkspaceById(project, workspaceId).label;

			this.registry.set(id, { ...bufferedTask, label: TaskIdentifier.create(workspaceLabel, name) });
		}

		this.buffer.clear();
	}

	private get project(): Project {
		if (this.#project === null) {
			throw new Error("Project is not configured. Please call configureProject() before using the registry.");
		}

		return this.#project;
	}

	public register(task: Omit<RegisteredTask, "id" | "label" | "workspaceId">) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		const id = TaskIdentifier.create(this.workspaceId, task.name);

		this.buffer.set(id, { ...task, id, workspaceId: this.workspaceId });
	}

	public has(taskName: string) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		return this.buffer.has(TaskIdentifier.create(this.workspaceId, taskName));
	}

	public getAll(): RegisteredTask[] {
		return [...this.registry.values()];
	}

	public getTaskNameByWorkspace(targetWorkspaceId: string): string[] {
		return this.getAll().flatMap(({ name, workspaceId }) => (targetWorkspaceId === workspaceId ? [name] : []));
	}

	public getByName(taskName: string): RegisteredTask[] {
		return this.getAll().filter(({ name }) => name === taskName);
	}

	public parse(taskInput: string, options: { strict?: boolean; targetWorkspaceId: string }): TaskIdentifier {
		const { taskNameInput, workspaceInput } = TaskIdentifier.parser(taskInput);
		const targetWorkspace =
			workspaceInput === undefined
				? Project.getWorkspaceById(this.project, options.targetWorkspaceId)
				: Project.getWorkspaceByLabelOrId(this.project, workspaceInput);
		const taskId = TaskIdentifier.create(targetWorkspace.id, taskNameInput);

		if (!this.registry.has(taskId) && options.strict) {
			throw new Error(`Task ${c.bold(taskId)} not found`);
		}

		return taskId;
	}

	public getById(taskId: TaskIdentifier): RegisteredTask {
		const task = this.registry.get(taskId);

		if (!task) {
			throw new Error(`Task ${c.bold(taskId)} not found`);
		}

		return task;
	}
}

export const taskRegistry = new TaskRegistry();
