import { uniq } from "lodash-es";

import { Project } from "../project.js";
import { BaseDependencyResolver } from "./base-dependency-resolver.js";

export class NpmDependencyResolver extends BaseDependencyResolver {
	public resolve(project: Project): Project {
		const packageNameToWorkspaceIdMap: Record<string, string | undefined> = Object.fromEntries(
			project.workspaces.map((workspace) => [workspace.packageJson.name, workspace.id])
		);

		const getPackageVersion = (workspaceId: string) => {
			return Project.getWorkspaceById(project, workspaceId).packageJson.version;
		};

		return {
			...project,
			workspaces: project.workspaces.map((workspace) => {
				return {
					...workspace,
					dependencies: uniq(
						[...Object.entries(workspace.packageJson.dependencies ?? {}), ...Object.entries(workspace.packageJson.devDependencies ?? {})].flatMap(
							([dependencyName, dependencyVersion]) => {
								const workspaceId = packageNameToWorkspaceIdMap[dependencyName];

								// If the dependency is not known, we skip it
								if (!workspaceId) {
									return [];
								}

								if (dependencyVersion === "*") {
									return [workspaceId];
								}

								// Clean the version prefix (e.g., ~ or ^) to compare with the workspace version
								if (this.cleanVersionPrefix(dependencyVersion) === getPackageVersion(workspaceId)) {
									return [workspaceId];
								}

								return [];
							}
						)
					)
				};
			})
		};
	}

	private cleanVersionPrefix(version: string): string {
		return version.replace(/^[~^]/, "");
	}
}
