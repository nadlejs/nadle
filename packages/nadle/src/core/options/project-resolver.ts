import Path from "node:path";

import { findUp } from "find-up";
import { sortBy } from "lodash-es";
import { findRoot } from "@manypkg/find-root";
import { NpmTool, PnpmTool, YarnTool, type Tool, type Package, type Packages } from "@manypkg/tools";

import type { NadlePackageJson } from "./types.js";
import { readJson, isPathExists } from "../utilities/fs.js";
import { COLON, PACKAGE_JSON } from "../utilities/constants.js";

const MonorepoDetectors: Tool[] = [PnpmTool, NpmTool, YarnTool];

interface Workspace {
	readonly id: string;
	readonly label: string;
	readonly relativePath: string;
	readonly absolutePath: string;
}
export namespace Workspace {
	export function create(pkg: Package): Workspace {
		const { dir: absolutePath, relativeDir: relativePath } = pkg;
		const id = pkg.relativeDir.replaceAll(Path.sep, COLON);

		return { id, label: id, absolutePath, relativePath };
	}
}

export interface Project {
	readonly packageManager: string;
	readonly workspaces: Workspace[];
	readonly rootWorkspace: Workspace;
}
export namespace Project {
	export const ROOT_WORKSPACE_ID = "root";

	export function create(packages: Packages): Project {
		return {
			packageManager: packages.tool.type,
			rootWorkspace: createRootWorkspace(packages.rootDir),
			workspaces: sortBy(packages.packages.map(Workspace.create), ["relativePath"])
		};
	}

	function createRootWorkspace(rootDir: string): Workspace {
		return { relativePath: ".", id: ROOT_WORKSPACE_ID, label: "root project", absolutePath: rootDir };
	}

	export async function resolve(cwd: string): Promise<Project> {
		const projectDir = await findUp(
			async (directory) => {
				const packageJsonPath = Path.join(directory, PACKAGE_JSON);

				if (await isPathExists(packageJsonPath)) {
					const packageJson = await readJson<NadlePackageJson>(packageJsonPath);

					if (packageJson.nadle?.root) {
						return directory;
					}
				}

				return undefined;
			},
			{ cwd, type: "directory" }
		);

		if (projectDir !== undefined) {
			for (const detector of MonorepoDetectors) {
				if (await detector.isMonorepoRoot(projectDir)) {
					const packages = await detector.getPackages(projectDir);

					return Project.create(packages);
				}
			}

			return { workspaces: [], packageManager: "npm", rootWorkspace: createRootWorkspace(projectDir) };
		}

		const monorepoRoot = await findRoot(cwd);
		const detector = MonorepoDetectors.find(({ type }) => type === monorepoRoot.tool);

		if (!detector) {
			throw new Error(
				`Unsupported monorepo tool: ${monorepoRoot.tool}. Supported tools are: ${MonorepoDetectors.map(({ type }) => type).join(", ")}.`
			);
		}

		return Project.create(await detector.getPackages(monorepoRoot.rootDir));
	}
}
