export type TaskFn = (context: TaskContext) => Promise<void> | void;

interface TaskMeta {
	options?: Record<string, unknown>;
	meta?: {
		dependsOn?: string[];
	};
}

interface TaskContext {
	env: NodeJS.ProcessEnv;
	args: Record<string, unknown>;
	options: Record<string, unknown>;
	configure(config: TaskMeta): void;
}

interface RegisteredTask {
	run: TaskFn;
	name: string;
	getMetadata: (context: TaskContext) => TaskMeta;
}

const taskRegistry = new Map<string, RegisteredTask>();

export function task(
	name: string,
	fn: TaskFn
): {
	meta: (collector: (context: TaskContext) => void) => void;
} {
	if (taskRegistry.has(name)) {
		throw new Error(`Task "${name}" already registered`);
	}

	let metaCollector: (context: TaskContext) => void = () => {};

	const register = () => {
		taskRegistry.set(name, {
			name,
			run: fn,
			getMetadata: (context) => {
				let capturedConfig: TaskMeta = {};
				context.configure = (meta: TaskMeta) => {
					capturedConfig = meta;
				};

				metaCollector(context);

				return capturedConfig;
			}
		});
	};

	register();

	return {
		meta: (collector) => {
			metaCollector = collector;
			register();
		}
	};
}

export function getRegisteredTasks() {
	return [...taskRegistry.values()];
}

const executed = new Set<string>();

export async function runTask(taskName: string, args: Record<string, any>) {
	const task = getRegisteredTasks().find((t) => t.name === taskName);

	if (!task) {
		throw new Error(`Task "${taskName}" not found`);
	}

	if (executed.has(task.name)) {
		return;
	}

	executed.add(task.name);

	const context: TaskContext = {
		args,
		options: {},
		env: process.env,
		configure(meta) {
			Object.assign(context, meta);
		}
	};

	const metadata = task.getMetadata(context);
	context.options = metadata.options || {};

	const deps = metadata.meta?.dependsOn ?? [];

	for (const dep of deps) {
		await runTask(dep, args);
	}

	await task.run(context);
}
