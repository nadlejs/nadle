import type fixturify from "fixturify";

import { type ConfigBuilder } from "./config-builder.js";

export interface PackageJsonFields {
	[key: string]: unknown;
	nadle?: { root?: boolean };
	type?: "module" | "commonjs";
	dependencies?: Record<string, string>;
}

function setNestedPath(root: fixturify.DirJSON, filePath: string, value: string | fixturify.DirJSON): void {
	const parts = filePath.split("/");
	let current = root;

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]!;

		if (!(part in current) || typeof current[part] === "string") {
			current[part] = {};
		}

		current = current[part] as fixturify.DirJSON;
	}

	current[parts.at(-1)!] = value;
}

function resolveConfigName(name?: string): string {
	if (!name) {
		return "nadle.config.ts";
	}

	return name.includes(".") ? name : `nadle.${name}.ts`;
}

export class FixtureBuilder {
	#files: fixturify.DirJSON = {};

	public packageJson(name?: string, fields?: PackageJsonFields): this {
		const json = {
			private: true,
			nadle: { root: true },
			name: name ?? "fixture",
			type: "module" as const,
			dependencies: { nadle: "workspace:*" },
			...fields
		};

		this.#files["package.json"] = JSON.stringify(json, null, "\t") + "\n";

		return this;
	}

	public config(builder: ConfigBuilder): this;
	public config(name: string, builder: ConfigBuilder): this;
	public config(nameOrBuilder: string | ConfigBuilder, builder?: ConfigBuilder): this {
		if (typeof nameOrBuilder === "string") {
			this.#files[resolveConfigName(nameOrBuilder)] = builder!.toString();
		} else {
			this.#files["nadle.config.ts"] = nameOrBuilder.toString();
		}

		return this;
	}

	public configRaw(content: string, fileName?: string): this {
		this.#files[fileName ?? "nadle.config.ts"] = content;

		return this;
	}

	public file(filePath: string, content: string): this {
		setNestedPath(this.#files, filePath, content);

		return this;
	}

	public dir(dirPath: string, contents?: fixturify.DirJSON): this {
		setNestedPath(this.#files, dirPath, contents ?? {});

		return this;
	}

	public build(): fixturify.DirJSON {
		return { ...this.#files };
	}
}

export function fixture(): FixtureBuilder {
	return new FixtureBuilder();
}
