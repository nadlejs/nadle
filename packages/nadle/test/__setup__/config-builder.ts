const RAW = Symbol("raw");

export interface RawExpression {
	readonly [RAW]: string;
}

/** Marks a config value to be emitted verbatim rather than JSON-serialized. */
export function raw(source: string): RawExpression {
	return { [RAW]: source };
}

function isRaw(value: unknown): value is RawExpression {
	return typeof value === "object" && value !== null && RAW in value;
}

/** Serialize config options to inner object-literal text, emitting raw values verbatim. */
function configInnerText(options: Record<string, unknown>): string {
	return Object.entries(options)
		.map(([key, value]) => `${JSON.stringify(key)}: ${isRaw(value) ? value[RAW] : JSON.stringify(value)}`)
		.join(", ");
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
			const configInner = task.configOptions ? configInnerText(task.configOptions) : undefined;
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
