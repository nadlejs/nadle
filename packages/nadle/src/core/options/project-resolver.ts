import Path from "node:path";
import Process from "node:process";

import {
	type Project,
	isPathExists,
	discoverProject,
	ROOT_WORKSPACE_ID,
	locateConfigFiles,
	resolveCurrentWorkspaceId,
	DEFAULT_CONFIG_FILE_NAMES
} from "@nadle/project";

import { Messages } from "../utilities/messages.js";

type WorkspaceInitializer = (workspaceId: string, configFilePath: string) => Promise<void>;

// eslint-disable-next-line no-restricted-properties
const cwd = Process.cwd();

export class ProjectResolver {
	public async resolve(rootConfigFilePathOption: string | undefined, onInitWorkspace: WorkspaceInitializer): Promise<Project> {
		let project = await discoverProject(cwd);

		const rootConfigFilePath = await this.resolveRootWorkspaceConfigFile(project.rootWorkspace.absolutePath, rootConfigFilePathOption);
		await onInitWorkspace(ROOT_WORKSPACE_ID, rootConfigFilePath);

		project = {
			...project,
			rootWorkspace: { ...project.rootWorkspace, configFilePath: rootConfigFilePath }
		};

		project = await locateConfigFiles(project);

		for (const workspace of project.workspaces) {
			if (workspace.configFilePath) {
				await onInitWorkspace(workspace.id, workspace.configFilePath);
			}
		}

		project = resolveCurrentWorkspaceId(project, cwd);

		return project;
	}

	private async resolveRootWorkspaceConfigFile(projectPath: string, rootConfigFilePath: string | undefined): Promise<string> {
		if (rootConfigFilePath !== undefined) {
			const resolvedConfigPath = Path.resolve(projectPath, rootConfigFilePath);

			if (!(await isPathExists(resolvedConfigPath))) {
				throw new Error(Messages.SpecifiedConfigFileNotFound(resolvedConfigPath));
			}

			return resolvedConfigPath;
		}

		for (const configFileName of DEFAULT_CONFIG_FILE_NAMES) {
			const configFilePath = Path.resolve(projectPath, configFileName);

			if (await isPathExists(configFilePath)) {
				return configFilePath;
			}
		}

		throw new Error(Messages.ConfigFileNotFound(projectPath));
	}
}
