/** Strip the surrounding braces of a stringified object literal, returning its inner property text. */
function objectInner(stringified: string): string {
	return stringified.trim().slice(1, -1).trim();
}

export class ConfigBuilder {
	#imports = new Set<string>();
	#configureOptions: Record<string, unknown> | undefined;
	#tasks: { name: string; action?: string; configOptions?: Record<string, unknown> }[] = [];

	public configure(options: Record<string, unknown>): this {
		this.#imports.add("configure");
		this.#configureOptions = options;

		return this;
	}

	public task(name: string, action?: string): this {
		this.#imports.add("tasks");
		this.#tasks.push({ name, action });

		return this;
	}

	public taskWithConfig(name: string, configOptions: Record<string, unknown>, action?: string): this {
		this.#imports.add("tasks");
		this.#tasks.push({ name, action, configOptions });

		return this;
	}

	public toString(): string {
		const lines: string[] = [];

		if (this.#imports.size > 0) {
			lines.push(`import { ${[...this.#imports].sort().join(", ")} } from "nadle";`);
			lines.push("");
		}

		if (this.#configureOptions) {
			lines.push(`configure(${JSON.stringify(this.#configureOptions, null, "\t")});`);
		}

		for (const task of this.#tasks) {
			const configInner = task.configOptions ? objectInner(JSON.stringify(task.configOptions, null, "\t")) : undefined;
			let statement: string;

			if (task.action && configInner !== undefined) {
				statement = `tasks.register("${task.name}", { run: ${task.action}, ${configInner} })`;
			} else if (task.action) {
				statement = `tasks.register("${task.name}", ${task.action})`;
			} else if (configInner !== undefined) {
				statement = `tasks.register("${task.name}", { ${configInner} })`;
			} else {
				statement = `tasks.register("${task.name}")`;
			}

			lines.push(`${statement};`);
		}

		return lines.join("\n");
	}
}

export function config(): ConfigBuilder {
	return new ConfigBuilder();
}
