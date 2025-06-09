import { type SupportLogLevel } from "../presentation/logger.js";

export interface NadleUserBaseConfigurations {
	readonly parallel?: boolean;
	readonly showSummary?: boolean;
	readonly logLevel?: SupportLogLevel;
	readonly minWorkers?: number | string;
	readonly maxWorkers?: number | string;

	/** @internal */
	readonly isWorkerThread?: boolean;
}

export interface NadleConfigFileConfigurations extends NadleUserBaseConfigurations {}

/** @internal */
export interface NadleCLIConfigurations extends NadleUserBaseConfigurations {
	readonly list: boolean;
	readonly dryRun: boolean;
	readonly configPath?: string;
	readonly showConfig: boolean;
	readonly stacktrace: boolean;
}

/** @internal */
export interface NadleResolvedConfigurations extends Required<Omit<NadleCLIConfigurations, "maxWorkers" | "minWorkers">> {
	readonly minWorkers: number;
	readonly maxWorkers: number;
}
