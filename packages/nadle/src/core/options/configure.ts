import { type NadleFileOptions } from "./types.js";
import { fileOptionRegistry } from "../registration/file-option-registry.js";

export function configure(options: NadleFileOptions) {
	if (typeof options !== "object" || options === null) {
		throw new TypeError("Options must be an object");
	}

	fileOptionRegistry.register(options);
}
