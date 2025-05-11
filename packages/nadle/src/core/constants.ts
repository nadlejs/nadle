// eslint-disable-next-line no-restricted-imports
import { type LogType } from "consola";

export const LogLevels = ["error", "log", "info", "debug"] as const satisfies LogType[];
export type LogLevel = (typeof LogLevels)[number];
