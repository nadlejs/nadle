import { type NadleConfigFileOptions } from "./types.js";

class OptionsRegistry {
	private options: Partial<NadleConfigFileOptions> = {};

	add(options: Partial<NadleConfigFileOptions>) {
		this.options = options;
	}

	get(): Partial<NadleConfigFileOptions> {
		return this.options;
	}
}

export const optionRegistry = new OptionsRegistry();
