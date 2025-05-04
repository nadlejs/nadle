export type TaskFn = (context: TaskContext) => Promise<void> | void;

export interface TaskMeta {
	options?: Record<string, unknown>;
	meta?: {
		dependsOn?: string[];
	};
}

export interface TaskContext {
	env: NodeJS.ProcessEnv;
	args: Record<string, unknown>;
	options: Record<string, unknown>;
	configure(config: TaskMeta): void;
}

export interface RegisteredTask {
	run: TaskFn;
	name: string;
	getMetadata: (context: TaskContext) => TaskMeta;
}
