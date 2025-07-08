import { type NadleFileOptions } from "./types.js";
import { fileOptionRegistry } from "../registration/file-option-registry.js";

/**
 * Configure Nadle with global file options.
 *
 * Registers the provided options object for use in Nadle's build process.
 *
 * @param options - The Nadle file options to register.
 * @throws {TypeError} If options is not an object.
 */
export function configure(options: NadleFileOptions) {
	if (typeof options !== "object" || options === null) {
		throw new TypeError("Options must be an object");
	}

	fileOptionRegistry.register(options);
}
