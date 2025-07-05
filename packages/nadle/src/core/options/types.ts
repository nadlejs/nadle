import { type Project } from "./project-resolver.js";
import { type SupportLogLevel } from "../reporting/logger.js";

export interface NadleBaseOptions {
	readonly cache?: boolean;
	readonly cacheDir?: string;

	readonly footer?: boolean;
	readonly parallel?: boolean;
	readonly logLevel?: SupportLogLevel;
	readonly minWorkers?: number | string;
	readonly maxWorkers?: number | string;

	/** @internal */
	readonly isWorkerThread?: boolean;
}

export interface NadleCLIOptions extends NadleBaseOptions {
	readonly list: boolean;
	readonly dryRun: boolean;
	readonly summary?: boolean;
	readonly configFile?: string;
	readonly showConfig: boolean;
	readonly stacktrace: boolean;
	readonly cleanCache?: boolean;

	readonly excludedTasks?: string[];
}

export interface NadleFileOptions extends NadleBaseOptions {}

export interface NadleResolvedOptions extends Required<Omit<NadleCLIOptions, "maxWorkers" | "minWorkers">> {
	readonly project: Project;

	readonly minWorkers: number;
	readonly maxWorkers: number;
}

export interface NadlePackageJson {
	readonly nadle?: {
		root?: true;
	};
}
