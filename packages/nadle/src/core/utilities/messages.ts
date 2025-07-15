import { highlight } from "./utils.js";
import { CONFIG_FILE_PATTERN } from "./constants.js";

export const Messages = {
	InvalidConfigureUsage: () => `configure function can only be called from the root workspace.`,
	SpecifiedConfigFileNotFound: (filePath: string) => `Config file not found at ${highlight(filePath)}. Please check the path.`,
	InvalidWorkerConfig: (type: "min" | "max", value: string) =>
		`Invalid value for --${type}-workers. Expect to be an integer or a percentage (e.g., 50%). Got: ${highlight(value)}`,
	ConfigFileNotFound: (projectPath: string) =>
		`No ${CONFIG_FILE_PATTERN}} found in ${highlight(projectPath)} directory or parent directories. Please use --config to specify a custom path.`,

	CycleDetected: (cyclePath: string) => `Cycle detected in task ${cyclePath}. Please resolve the cycle before executing tasks.`,
	DuplicatedTaskName: (taskName: string, workspaceId: string) =>
		`Task ${highlight(taskName)} already registered in workspace ${highlight(workspaceId)}`,
	NoTasksFound: () =>
		`No tasks were specified. Please specify one or more tasks to execute, or use the ${highlight("--list")} option to view available tasks.`,
	UnresolvedTaskWithoutSuggestions: (taskNameInput: string, targetWorkspaceId: string) =>
		`Task ${highlight(taskNameInput)} not found in ${highlight(targetWorkspaceId)} workspace.`,
	InvalidTaskName: (taskName: string) =>
		`Invalid task name: ${highlight(taskName)}. Task names must contain only letters, numbers, and dashes; start with a letter, and not end with a dash.`,
	UnresolvedTaskWithSuggestions: (taskNameInput: string, targetWorkspaceId: string, fallbackWorkspaceId: string | undefined, suggestions: string) =>
		`Task ${highlight(taskNameInput)} not found in ${highlight(targetWorkspaceId)}${fallbackWorkspaceId ? ` nor ${highlight(fallbackWorkspaceId)}` : ""} workspace. ${suggestions}`,

	EmptyWorkspaceLabel: (workspaceId: string) => `Workspace ${highlight(workspaceId)} alias can not be empty.`,
	UnresolvedWorkspace: (workspaceInput: string, suggestions: string) => `Workspace ${highlight(workspaceInput)} not found. ${suggestions}`,
	WorkspaceNotFound: (workspaceInput: string, availableWorkspaces: string) =>
		`Workspace ${highlight(workspaceInput)} not found. Available workspaces: ${availableWorkspaces}.`,
	WorkspaceIdNotFound: (workspaceId: string, availableWorkspaces: string) =>
		`Workspace with id ${highlight(workspaceId)} not found. Available workspaces: ${availableWorkspaces}.`,
	DuplicatedWorkspaceLabelWithOtherLabel: (workspaceId: string, workspaceLabel: string, duplicatedWorkspaceId: string) =>
		`Workspace ${highlight(workspaceId)} has a duplicated label ${highlight(workspaceLabel)} with workspace ${highlight(duplicatedWorkspaceId)}. Please check the alias configuration in the configuration file.`,
	DuplicatedWorkspaceLabelWithOtherId: (workspaceId: string, workspaceLabel: string, duplicatedWorkspaceId: string) =>
		`Workspace ${highlight(workspaceId)} has a label ${highlight(workspaceLabel)} that is the same as workspace ${highlight(duplicatedWorkspaceId)}'s id. Please check the alias configuration in the configuration file.`
};
