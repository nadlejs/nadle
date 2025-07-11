import { type Task } from "../interfaces/task.js";

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
