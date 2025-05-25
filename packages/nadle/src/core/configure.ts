import { optionRegistry } from "./options-registry.js";
import { type NadleConfigFileOptions } from "./options.js";

export function configure(options: Partial<NadleConfigFileOptions>) {
	if (typeof options !== "object" || options === null) {
		throw new TypeError("Options must be an object");
	}

	optionRegistry.add(options);
}
