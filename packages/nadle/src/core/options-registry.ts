import { type NadleConfigFileOptions } from "./options.js";

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
