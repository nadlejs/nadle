import Path from "node:path";

import { findUp } from "find-up";
import { sortBy } from "lodash-es";
import { findRoot } from "@manypkg/find-root";
import { NpmTool, PnpmTool, YarnTool, type Tool, type Packages, type Package as ManyPkgPackage } from "@manypkg/tools";

import type { NadlePackageJson } from "./types.js";
import { PACKAGE_JSON } from "../utilities/constants.js";
import { readJson, isPathExists } from "../utilities/fs.js";

const MonorepoDetectors: Tool[] = [PnpmTool, NpmTool, YarnTool];

interface Workspace {
	readonly relativePath: string;
	readonly absolutePath: string;
}
export namespace Workspace {
	export function create(pkg: ManyPkgPackage): Workspace {
		return { absolutePath: pkg.dir, relativePath: pkg.relativeDir };
	}
}

export interface Project {
	readonly path: string;
	readonly packageManager: string;
	readonly workspaces: Workspace[];
}
export namespace Project {
	export function create(packages: Packages): Project {
		return {
			path: packages.rootDir,
			packageManager: packages.tool.type,
			workspaces: sortBy(packages.packages.map(Workspace.create), ["relativePath"])
		};
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

			return { workspaces: [], path: projectDir, packageManager: "npm" };
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
