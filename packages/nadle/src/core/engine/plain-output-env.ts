import { type TaskEnv } from "../interfaces/task-configuration.js";

const COLOR_KEYS = ["FORCE_COLOR", "NO_COLOR"];

/**
 * Task env for the plain-output reporter: asks tools not to color their output
 * (`NO_COLOR=1`) unless the user already expressed a color preference.
 */
export function withPlainOutput(originalEnv: NodeJS.ProcessEnv, taskEnv: TaskEnv | undefined, reporter: string): TaskEnv | undefined {
	if (reporter !== "agent") {
		return taskEnv;
	}

	const hasPreference = COLOR_KEYS.some((key) => originalEnv[key] !== undefined || taskEnv?.[key] !== undefined);

	return hasPreference ? taskEnv : { ...taskEnv, NO_COLOR: "1" };
}
