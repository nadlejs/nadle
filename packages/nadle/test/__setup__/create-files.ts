import yaml from "yaml";
import serializeJson from "serialize-javascript";
import { type NadleFileOptions } from "src/index.js";
import type { TaskConfiguration } from "src/index.js";
import { type PackageJson } from "@nadle/project-resolver";
import { Project, QuoteKind, ScriptTarget } from "ts-morph";
import { stringify } from "src/core/utilities/stringify.js";

export function createPackageJson(name: string = "root", otherFields?: Partial<Omit<PackageJson & { workspaces: string[] }, "name">>): string {
	return stringify({ name, type: "module", ...(otherFields ?? {}) });
}

export function createPnpmWorkspace(packages: string[] = ["./**"]) {
	return yaml.stringify({ packages });
}

export function createNadleConfig(params?: { configure?: NadleFileOptions; tasks?: { name: string; config?: TaskConfiguration }[] }): string {
	const project = new Project({
		useInMemoryFileSystem: true,
		compilerOptions: { target: ScriptTarget.ESNext },
		manipulationSettings: { quoteKind: QuoteKind.Double }
	});

	const sourceFile = project.createSourceFile("nadle.config.ts", "", { overwrite: true });

	sourceFile.addImportDeclaration({
		moduleSpecifier: "nadle",
		namedImports: ["tasks", "configure"]
	});

	if (params?.configure) {
		sourceFile.addStatements(`configure( ${serializeJson(params?.configure, 2)} );`);
	}

	for (const task of params?.tasks ?? []) {
		const { name, config } = task;

		let taskRegisterStatement = `tasks.register("${name}")`;

		if (config) {
			taskRegisterStatement += `\n.config(${serializeJson(config, 2)})`;
		}

		taskRegisterStatement += ";";

		sourceFile.addStatements(taskRegisterStatement);
	}

	return sourceFile.getFullText();
}
