import { type Task } from "../interfaces/task.js";
import { type TaskSpec } from "./api.js";

/**
 * Parameters for defining a task.
 */
export interface DefineTaskParams<Options> extends Task<Options> {}

/**
 * Define a task with the given parameters.
 *
 * @param params - The task parameters.
 * @returns The defined task.
 */
export function defineTask<Options>(params: DefineTaskParams<Options>): Task<Options> {
	return params;
}

/**
 * Identity helper for authoring a task spec with full type inference
 * (mirrors `defineTask`). Useful for programmatic/spread registration.
 */
export function defineSpec<Options = void>(spec: TaskSpec<Options>): TaskSpec<Options> {
	return spec;
}
