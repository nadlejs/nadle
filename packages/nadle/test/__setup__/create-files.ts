import yaml from "yaml";
import stringify from "serialize-javascript";
import { type NadleFileOptions } from "src/index.js";
import { Project, QuoteKind, ScriptTarget } from "ts-morph";

export function createPackageJson(name: string = "root") {
	return stringify({ name, type: "module" });
}

export function createPnpmWorkspace(packages: string[] = ["./**"]) {
	return yaml.stringify({ packages });
}

export function createNadleConfig(params: { configure?: NadleFileOptions; tasks?: { log: string; name: string; dependsOn?: string[] }[] }): string {
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

	if (params.configure) {
		sourceFile.addStatements(`configure(${stringify(params.configure)});`);
	}

	for (const task of params.tasks ?? []) {
		const { log, name, dependsOn } = task;

		let taskRegisterStatement = `tasks.register("${name}", () => {console.log("${log}");})`;

		if (dependsOn) {
			taskRegisterStatement += `.config({dependsOn: [${dependsOn.map((dep) => `"${dep}"`).join(", ")}]})`;
		}

		taskRegisterStatement += ";";

		sourceFile.addStatements(taskRegisterStatement);
	}

	return sourceFile.getFullText();
}
