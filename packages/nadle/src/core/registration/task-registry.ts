import c from "tinyrainbow";

import { TaskIdentifier } from "./task-identifier.js";
import { Project } from "../options/project-resolver.js";
import { TaskStatus, type RegisteredTask } from "./types.js";

export class TaskRegistry {
	private readonly registry = new Map<TaskIdentifier, RegisteredTask>();
	/**
	 * The id of the workspace where tasks are registering.
	 */
	private workspaceId: string | null = null;

	#project: Project | null = null;

	public updateWorkspaceId(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	public configureProject(project: Project) {
		this.#project = project;

		this.updateRootWorkspaceTaskLabels();
	}

	private get project(): Project {
		if (this.#project === null) {
			throw new Error("Project is not configured. Please call configureProject() before using the registry.");
		}

		return this.#project;
	}

	private updateRootWorkspaceTaskLabels() {
		if (this.project.rootWorkspace.label === Project.ROOT_WORKSPACE_LABEL) {
			return;
		}

		for (const task of this.getAll()) {
			const { name, workspaceId } = task;

			if (!Project.isRootWorkspace(workspaceId)) {
				continue;
			}

			const workspace = Project.getWorkspaceById(this.project, workspaceId);

			this.registry.set(task.id, { ...task, label: TaskIdentifier.create(workspace.label, name) });
		}
	}

	public register(task: Omit<RegisteredTask, "id" | "label" | "workspaceId">) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		const id = TaskIdentifier.create(this.workspaceId, task.name);
		const label = Project.isRootWorkspace(this.workspaceId)
			? task.name
			: TaskIdentifier.create(Project.getWorkspaceById(this.project, this.workspaceId).label, task.name);

		this.registry.set(id, { ...task, id, label, workspaceId: this.workspaceId });
	}

	public has(taskName: string) {
		if (this.workspaceId === null) {
			throw new Error("Working directory is not set. Please call updateWorkingDir() before registering tasks.");
		}

		return this.registry.has(TaskIdentifier.create(this.workspaceId, taskName));
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
		const task = this.findById(taskId);

		if (!task) {
			throw new Error(`Task ${c.bold(taskId)} not found`);
		}

		return task;
	}

	private findById(taskId: TaskIdentifier): RegisteredTask | undefined {
		return this.registry.get(taskId);
	}

	public onTaskStart(id: TaskIdentifier) {
		const task = this.getById(id);

		task.status = TaskStatus.Running;
		task.result.startTime = Date.now();
	}

	public onTaskFinish(id: TaskIdentifier) {
		const task = this.getById(id);

		if (task.result.startTime === null) {
			throw new Error(`Task ${c.bold(id)} was not started properly`);
		}

		task.status = TaskStatus.Finished;
		task.result.duration = Date.now() - task.result.startTime;
	}

	public onTaskUpToDate(id: TaskIdentifier) {
		this.getById(id).status = TaskStatus.UpToDate;
	}

	public onTaskRestoreFromCache(id: TaskIdentifier) {
		this.getById(id).status = TaskStatus.FromCache;
	}

	public onTaskFailed(id: TaskIdentifier) {
		const task = this.getById(id);

		if (task.result.startTime === null) {
			throw new Error(`Task ${c.bold(id)} was not started properly`);
		}

		task.status = TaskStatus.Failed;
		task.result.duration = Date.now() - task.result.startTime;
	}

	public onTaskCanceled(id: TaskIdentifier) {
		const task = this.getById(id);

		task.status = TaskStatus.Canceled;
	}

	public onTasksScheduled(ids: TaskIdentifier[]) {
		for (const id of ids) {
			this.getById(id).status = TaskStatus.Scheduled;
		}
	}
}

export const taskRegistry = new TaskRegistry();
