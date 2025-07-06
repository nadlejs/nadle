import { type NadleFileOptions } from "./types.js";
import { fileOptionsRegistry } from "../registration/file-options-registry.js";

export function configure(options: NadleFileOptions) {
	if (typeof options !== "object" || options === null) {
		throw new TypeError("Options must be an object");
	}

	fileOptionsRegistry.add(options);
}
