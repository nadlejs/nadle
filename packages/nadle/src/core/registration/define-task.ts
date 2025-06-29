import { type Task } from "../types.js";

export interface DefineTaskParams<Options> extends Task<Options> {}

export function defineTask<Options>(params: DefineTaskParams<Options>): Task<Options> {
	return params;
}
