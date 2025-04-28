type TaskFn = () => void | Promise<void>;

const tasks = new Map<string, TaskFn>();

export function task(name: string, fn: TaskFn) {
	if (tasks.has(name)) {
		throw new Error(`Task "${name}" already registered`);
	}

	tasks.set(name, fn);
}

export function getRegisteredTasks() {
	return [...tasks.keys()];
}

export async function runTask(name: string) {
	const fn = tasks.get(name);

	if (!fn) {
		throw new Error(`Task "${name}" not found. Candidate tasks: ${Array.from(tasks.keys()).join(", ")}`);
	}

	await fn();
}
