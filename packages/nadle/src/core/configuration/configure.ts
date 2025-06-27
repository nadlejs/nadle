import { type NadleConfigFileOptions } from "./types.js";
import { optionRegistry } from "../registration/options-registry.js";

export function configure(options: Partial<NadleConfigFileOptions>) {
	if (typeof options !== "object" || options === null) {
		throw new TypeError("Options must be an object");
	}

	optionRegistry.add(options);
}
