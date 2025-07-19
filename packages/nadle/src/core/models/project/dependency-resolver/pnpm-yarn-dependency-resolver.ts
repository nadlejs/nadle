import { uniq } from "lodash-es";

import { type Project } from "../project.js";
import { BaseDependencyResolver } from "./base-dependency-resolver.js";

export class PnpmYarnDependencyResolver extends BaseDependencyResolver {
	public resolve(project: Project): Project {
		const workspaceNameToIdMap: Record<string, string | undefined> = Object.fromEntries(
			project.workspaces.map((workspace) => [workspace.packageJson.name, workspace.id])
		);

		return {
			...project,
			workspaces: project.workspaces.map((workspace) => {
				return {
					...workspace,
					dependencies: uniq(
						[...Object.entries(workspace.packageJson.dependencies ?? {}), ...Object.entries(workspace.packageJson.devDependencies ?? {})].flatMap(
							([packageName, packageVersion]) => {
								const workspaceId = workspaceNameToIdMap[packageName];

								if (packageVersion.startsWith("workspace:") && workspaceId) {
									return workspaceId;
								}

								return [];
							}
						)
					)
				};
			})
		};
	}
}
