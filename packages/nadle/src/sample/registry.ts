class Registry {
	private readonly tasks: string[] = [];

	add(task: string) {
		this.tasks.push(task);
	}

	getAll() {
		return this.tasks;
	}
}

const globalKey = Symbol.for("nadle.registry");
const globalSymbols = Object.getOwnPropertySymbols(globalThis);
const hasRegistry = globalSymbols.includes(globalKey);

if (!hasRegistry) {
	(globalThis as any)[globalKey] = new Registry();
}

export const registry = (globalThis as any)[globalKey] as Registry;
