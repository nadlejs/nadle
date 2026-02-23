import Path from "node:path";

import { type Package, type PackageJSON as ManyPkgPackageJson } from "@manypkg/tools";
import { DOT, SLASH, BACKSLASH, ROOT_WORKSPACE_ID, deriveWorkspaceId } from "@nadle/kernel";

import { readJson } from "./fs.js";
import { PACKAGE_JSON } from "./constants.js";
import { type Workspace, type PackageJson, type RootWorkspace } from "./types.js";

function createPackageJson(pkg: ManyPkgPackageJson): PackageJson {
	const { name, version, dependencies, devDependencies } = pkg;

	return { name, version, dependencies, devDependencies };
}

export function createWorkspace(pkg: Package): Workspace {
	const { relativeDir, packageJson, dir: absolutePath } = pkg;
	const relativePath = relativeDir.replaceAll(BACKSLASH, SLASH);
	const id = deriveWorkspaceId(relativePath);

	return {
		id,
		label: id,
		absolutePath,
		relativePath,
		dependencies: [],
		configFilePath: null,
		packageJson: createPackageJson(packageJson)
	};
}

export async function createRootWorkspace(absolutePath: string): Promise<RootWorkspace> {
	const packageJson = await readJson<PackageJson>(Path.join(absolutePath, PACKAGE_JSON));

	return {
		label: "",
		packageJson,
		absolutePath,
		dependencies: [],
		relativePath: DOT,
		configFilePath: "",
		id: ROOT_WORKSPACE_ID
	};
}
