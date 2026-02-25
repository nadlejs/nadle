export type PackageManager = "pnpm" | "npm" | "yarn";

export type ScriptCategory = "task" | "long-running" | "lifecycle" | "pre-post";

export type NadleTaskType = "ExecTask" | "PnpmTask" | "NpmTask" | "NpxTask" | "PnpxTask" | "NodeTask" | "DeleteTask" | "CopyTask" | "inline";

export interface ScriptEntry {
	name: string;
	command: string;
	dependsOn: string[];
	parsedArgs: string[];
	nadleTaskName: string;
	parsedCommand: string;
	taskType: NadleTaskType;
	category: ScriptCategory;
	envVars: Record<string, string>;
}

export interface ProjectContext {
	rootDir: string;
	hasNadle: boolean;
	hasConfig: boolean;
	isMonorepo: boolean;
	hasTypeScript: boolean;
	scripts: ScriptEntry[];
	packageManager: PackageManager;
	packageJson: Record<string, unknown>;
}

export interface WizardAnswers {
	confirmRoot: boolean;
	overwriteConfig: boolean;
	selectedScripts: string[];
}
