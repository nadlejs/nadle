import { type SupportLogLevel } from "../logger.js";

export interface NadleUserBaseOptions {
	readonly sequence?: boolean;
	readonly showSummary?: boolean;
	readonly logLevel?: SupportLogLevel;
	readonly minWorkers?: number | string;
	readonly maxWorkers?: number | string;

	/** @internal */
	readonly isWorkerThread?: boolean;
}

export interface NadleCLIOptions extends NadleUserBaseOptions {
	readonly list: boolean;
	readonly dryRun: boolean;
	readonly configPath?: string;
	readonly showConfig: boolean;
	readonly stacktrace?: boolean;
}

export interface NadleConfigFileOptions extends NadleUserBaseOptions {}

export interface NadleResolvedOptions extends Required<Omit<NadleCLIOptions, "maxWorkers" | "minWorkers">> {
	readonly minWorkers: number;
	readonly maxWorkers: number;
}
