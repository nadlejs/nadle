import Path from "node:path";
import Fs from "node:fs/promises";

import { glob } from "glob";
import c from "tinyrainbow";
import { type PackageJson } from "type-fest";

const rootDir = Path.join(import.meta.dirname, "..", "..", "..");
const nadlePackagePath = Path.join(rootDir, "packages", "nadle", "package.json");
const nadlePackage = JSON.parse(await Fs.readFile(nadlePackagePath, "utf-8")) as PackageJson;

export async function validatePackages() {
	for (const entry of await glob("**/package.json", {
		cwd: rootDir,
		ignore: ["node_modules/**", "**/__temp__/**"]
	})) {
		const path = Path.join(rootDir, entry);
		const pkg = JSON.parse(await Fs.readFile(path, "utf-8"));

		if (!pkg.name) {
			continue;
		}

		console.log(c.cyan(`Validating package.json at ${entry}`));

		for (const validator of validators) {
			try {
				await validator({ pkg, path });
			} catch (error) {
				console.error(c.red(`x Failed ${validator.name}`));
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				error.message = `${error.message} in file://${path}`;
				throw error;
			}
		}
	}

	await readmeValidator();
}

type PackageValidator = (context: { path: string; pkg: PackageJson }) => void | Promise<void>;

const readmeValidator = async () => {
	console.log(c.cyan("Validating README.md"));
	const rootReadme = await Fs.readFile(Path.join(rootDir, "README.md"));
	const nadleReadme = await Fs.readFile(Path.join(nadlePackagePath, "..", "README.md"));

	if (rootReadme.toString() !== nadleReadme.toString()) {
		throw new Error("Root README.md must be the same as nadle README.md");
	}
};

const nameValidator: PackageValidator = ({ pkg, path }) => {
	const { name } = pkg;

	if (name === undefined) {
		throw new Error("Package name is required");
	}

	const pkgDirPath = Path.dirname(Path.relative(rootDir, path));

	if (!pkgDirPath.startsWith("packages") && name !== "@nadle/root") {
		throw new Error("Package must be located in the 'packages' directory. Got: " + pkgDirPath);
	}

	const dirName = pkgDirPath.split(Path.sep)[1];

	if (dirName !== undefined && name === dirName) {
		return;
	}

	if (!name.startsWith("@nadle")) {
		throw new Error("Package name must start with @nadle");
	}

	if (!isPrivate(pkg)) {
		const expectedName = `@nadle/${dirName}`;

		if (name !== expectedName) {
			throw new Error("Public scoped package name must match its directory. Expected: " + expectedName + ". Got: " + name);
		}

		return;
	}

	if (name === "@nadle/root") {
		return;
	}

	const expectedName = `@nadle/internal-${pkgDirPath.replaceAll("_", "").split(Path.sep).slice(1).join("-")}`;

	if (name !== expectedName) {
		throw new Error("Private package name must be matched its location. Expected: " + expectedName + ". Got: " + name);
	}
};

const versionValidator: PackageValidator = ({ pkg }) => {
	if (isPrivate(pkg)) {
		if (pkg.version) {
			throw new Error(`Private packages should not have "version" field`);
		}

		return;
	}

	if (!pkg.version) {
		throw new Error(`Public packages must have "version" field`);
	}
};

const typeValidator: PackageValidator = ({ pkg }) => {
	if (pkg.name === "@nadle/internal-docs") {
		return;
	}

	if (!pkg.type) {
		throw new Error(`"type" field is required"`);
	}

	const hasVSCodeEngine = !!(pkg.engines as Record<string, string> | undefined)?.vscode;

	if (isPublic(pkg) && pkg.type !== "module" && !hasVSCodeEngine) {
		throw new Error("Public package type must be module");
	}
};

const descriptionValidator: PackageValidator = ({ pkg }) => {
	if (isPublic(pkg) && !pkg.description) {
		throw new Error("Public packages must have 'description' field");
	}
};

const licenseValidator: PackageValidator = ({ pkg }) => {
	if (isPublic(pkg) && pkg.license !== "MIT") {
		throw new Error("Public packages must have 'MIT' license");
	}
};

function createSimpleValidator(field: string, { mustMatch }: { mustMatch: boolean }): PackageValidator {
	const obj = {
		[`${field}Validator`]: function (context: { pkg: PackageJson }) {
			const { pkg } = context;

			if (isPrivate(pkg)) {
				return;
			}

			if (!pkg[field]) {
				throw new Error(`Public packages must have ${field} field`);
			}

			if (mustMatch && !isEqual(nadlePackage[field], pkg[field])) {
				throw new Error(`Public packages must have the same ${field} as nadle package`);
			}
		}
	};

	return obj[`${field}Validator`];
}

const filesValidator: PackageValidator = ({ pkg }) => {
	if (isPublic(pkg) && !pkg.files?.length) {
		throw new Error("Public packages must have 'files' field");
	}
};

const exportsValidator: PackageValidator = ({ pkg }) => {
	if (isPrivate(pkg) || pkg.bin || pkg.main) {
		return;
	}

	if (!pkg.exports) {
		throw new Error("Public packages must have 'exports' field");
	}
};

const typesValidator: PackageValidator = ({ pkg }) => {
	if (!pkg.exports) {
		return;
	}

	if (!pkg.types) {
		throw new Error("Packages with exports must have 'types' field");
	}
};

const REPOSITORY_URL = "git+https://github.com/nadlejs/nadle.git";

const repositoryValidator: PackageValidator = ({ pkg, path }) => {
	if (isPrivate(pkg)) {
		return;
	}

	if (!pkg.repository || typeof pkg.repository !== "object") {
		throw new Error(`Public packages must have object "repository" field`);
	}

	if (pkg.repository.type !== "git") {
		throw new Error("Public packages must have git repository type");
	}

	if (pkg.repository.url !== REPOSITORY_URL) {
		throw new Error("Public packages must have repository url");
	}

	const relativePath = Path.dirname(Path.relative(rootDir, path)).replace(/\\/g, "/");
	const directory = pkg.repository.directory?.replace(/\\/g, "/");

	if (directory !== relativePath) {
		throw new Error(`Public packages must have a proper repository.directory. Expect ${relativePath}. Got: ${pkg.repository.directory}`);
	}
};

const privateValidator: PackageValidator = ({ pkg }) => {
	if (isPrivate(pkg) && pkg.private !== true) {
		throw new Error(`"Private packages must have "private" field set to true"`);
	}
};

const FIELD_ORDER = [
	"name",
	"displayName",
	"version",
	"publisher",
	"icon",
	"description",
	"license",
	"type",
	"private",
	"scripts",
	"files",
	"exports",
	"bin",
	"types",
	"main",
	"dependencies",
	"devDependencies",
	"engines",
	"categories",
	"activationEvents",
	"contributes",
	"browserslist",
	"author",
	"repository",
	"keywords",
	"homepage",
	"bugs",
	"packageManager",
	"pnpm",
	"nadle",
	"prettier",
	"lint-staged",
	"size-limit",
	// For yarn/npm fixtures
	"workspaces"
];

const fieldsOrderValidator: PackageValidator = ({ pkg }) => {
	validateOrder(Object.keys(pkg), FIELD_ORDER);
};

function validateOrder(actualList: string[], order?: string[]) {
	const expectedList = order ?? [...actualList].sort((a, b) => a.localeCompare(b, "en"));

	for (let i = 0; i < actualList.length; i++) {
		for (let j = i + 1; j < actualList.length; j++) {
			const itemA = actualList[i];
			const itemB = actualList[j];
			const indexA = expectedList.indexOf(itemA);
			const indexB = expectedList.indexOf(itemB);

			if (indexA === -1) {
				throw new Error(`The field "${itemA}" is not allowed`);
			}

			if (indexB === -1) {
				throw new Error(`The field "${itemB}" is not allowed`);
			}

			if (indexA > indexB) {
				throw new Error(`The field "${itemB}" should be before "${itemA}"`);
			}
		}
	}
}

function createDependenciesOrderValidator(type: "dependencies" | "devDependencies"): PackageValidator {
	return ({ pkg }) => {
		const dependencies = pkg[type];

		if (!dependencies) {
			return;
		}

		validateOrder(Object.keys(dependencies));
	};
}

const fixturesValidator: PackageValidator = ({ pkg, path }) => {
	const allowedPackages = [
		"@nadle/internal-nadle-test-fixtures-project-dir-",
		"@nadle/internal-nadle-test-fixtures-pnpm-workspaces-",
		"@nadle/internal-nadle-test-fixtures-monorepo"
	];

	if (path.includes(Path.join(Path.dirname(nadlePackagePath), "test", "__fixtures__"))) {
		if (!("nadle" in pkg && (pkg.nadle as any)?.root === true) && !allowedPackages.some((allowPkg) => pkg.name?.startsWith(allowPkg))) {
			throw new Error(`Test packages must have nadle.root = true field`);
		}
	}
};

const testScriptValidator: PackageValidator = ({ pkg, path }) => {
	if (pkg.scripts?.test?.includes("--update")) {
		throw new Error(`Test script in ${path} should not include "--update" flag`);
	}
};

const validators: PackageValidator[] = [
	nameValidator,
	versionValidator,
	typeValidator,
	descriptionValidator,
	licenseValidator,
	createSimpleValidator("keywords", { mustMatch: false }),
	createSimpleValidator("homepage", { mustMatch: true }),
	createSimpleValidator("bugs", { mustMatch: true }),
	filesValidator,
	exportsValidator,
	typesValidator,
	repositoryValidator,
	privateValidator,
	fixturesValidator,
	fieldsOrderValidator,
	createDependenciesOrderValidator("dependencies"),
	createDependenciesOrderValidator("devDependencies"),
	testScriptValidator
];

function isEqual(a: unknown, b: unknown) {
	return JSON.stringify(a) === JSON.stringify(b);
}

function isPrivate(pkg: PackageJson) {
	return pkg.private === true || !pkg.version || pkg.name?.includes("/internal");
}

function isPublic(pkg: PackageJson) {
	return !isPrivate(pkg);
}
