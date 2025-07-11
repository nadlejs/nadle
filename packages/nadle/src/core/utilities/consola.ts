import { isCI, isTest } from "std-env";
// eslint-disable-next-line no-restricted-imports
import { LogLevels, type LogType, createConsola, type LogObject, type InputLogObject, type ConsolaOptions, type ConsolaReporter } from "consola";

export { LogLevels };
export type { InputLogObject };

// Workaround to get builtin BasicReporter
const [BasicReporter] = createConsola({ fancy: false }).options.reporters;
const [FancyReporter] = createConsola({ fancy: true }).options.reporters;
class CIReporter implements ConsolaReporter {
	public log(logObj: LogObject, ctx: { options: ConsolaOptions }) {
		// Setting type = "" to avoid consola to add type prefix to the message
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		BasicReporter.log({ ...logObj, type: "" }, ctx);
	}
}

function createConsolaReporters(): ConsolaReporter[] {
	if (isTest) {
		return [BasicReporter];
	}

	if (isCI) {
		return [new CIReporter()];
	}

	return [FancyReporter];
}

export function createNadleConsola(logLevel: SupportLogLevel = "log") {
	return createConsola({ level: LogLevels[logLevel], formatOptions: { date: false }, reporters: createConsolaReporters() });
}

/**
 * Supported log levels for Nadle.
 */
export const SupportLogLevels = ["error", "log", "info", "debug"] as const satisfies LogType[];

/**
 * Type representing supported log levels.
 */
export type SupportLogLevel = (typeof SupportLogLevels)[number];
