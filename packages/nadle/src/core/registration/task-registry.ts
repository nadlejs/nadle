import Perf from "node:perf_hooks";

import c from "tinyrainbow";

import { Project } from "../models/project.js";
import { TaskIdentifier } from "./task-identifier.js";
import { TaskStatus, type RegisteredTask } from "./types.js";

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

	public getAllTaskIds(): string[] {
		return this.getAll().map(({ id }) => id);
	}

	public getByName(taskName: string): RegisteredTask[] {
		return this.getAll().filter(({ name }) => name === taskName);
	}

	public parse(taskInput: string, currentWorkspaceId = Project.ROOT_WORKSPACE_ID): TaskIdentifier {
		const { taskNameInput, workspaceInput } = TaskIdentifier.parser(taskInput);
		const targetWorkspace =
			workspaceInput === undefined ? Project.getWorkspaceById(this.project, currentWorkspaceId) : Project.findWorkspace(this.project, workspaceInput);
		const taskId = TaskIdentifier.create(targetWorkspace.id, taskNameInput);

		if (!this.registry.has(taskId)) {
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

	public onTaskStart(id: TaskIdentifier) {
		this.updateTask(id, { startTime: true, status: TaskStatus.Running });
	}

	public onTaskFinish(id: TaskIdentifier) {
		this.updateTask(id, { duration: true, status: TaskStatus.Failed });
	}

	public onTaskUpToDate(id: TaskIdentifier) {
		this.updateTask(id, { status: TaskStatus.UpToDate });
	}

	public onTaskRestoreFromCache(id: TaskIdentifier) {
		this.updateTask(id, { status: TaskStatus.FromCache });
	}

	public onTaskFailed(id: TaskIdentifier) {
		this.updateTask(id, { duration: true, status: TaskStatus.Failed });
	}

	public onTaskCanceled(id: TaskIdentifier) {
		this.updateTask(id, { status: TaskStatus.Canceled });
	}

	public onTasksScheduled(ids: TaskIdentifier[]) {
		for (const id of ids) {
			this.updateTask(id, { status: TaskStatus.Scheduled });
		}
	}

	private updateTask(taskId: string, payload: Partial<{ duration: true; startTime: true; status: TaskStatus }>) {
		const task = this.getById(taskId);

		if (payload.status !== undefined) {
			task.status = payload.status;
		}

		if (payload.startTime === true) {
			task.result.startTime = Perf.performance.now();
		}

		if (payload.duration == true) {
			if (task.result.startTime === null) {
				throw new Error(`Task ${c.bold(taskId)} was not started properly`);
			}

			task.result.duration = Perf.performance.now() - task.result.startTime;
		}
	}
}

export const taskRegistry = new TaskRegistry();
