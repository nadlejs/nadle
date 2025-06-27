import { type SupportLogLevel } from "../reporting/logger.js";

export interface NadleUserBaseOptions {
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

export interface NadleCLIOptions extends NadleUserBaseOptions {
	readonly list: boolean;
	readonly dryRun: boolean;
	readonly configFile?: string;
	readonly showConfig: boolean;
	readonly stacktrace: boolean;
	readonly cleanCache?: boolean;

	readonly excludedTasks?: string[];
}

export interface NadleConfigFileOptions extends NadleUserBaseOptions {}

export interface NadleResolvedOptions extends Required<Omit<NadleCLIOptions, "maxWorkers" | "minWorkers">> {
	readonly projectDir: string;

	readonly minWorkers: number;
	readonly maxWorkers: number;
}

export interface NadlePackageJson {
	readonly nadle?: {
		root?: true;
	};
}
