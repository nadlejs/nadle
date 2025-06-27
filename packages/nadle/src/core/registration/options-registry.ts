import { type NadleConfigFileOptions } from "../configuration/types.js";

class OptionsRegistry {
	private options: Partial<NadleConfigFileOptions> = {};

	public add(options: Partial<NadleConfigFileOptions>) {
		this.options = options;
	}

	public get(): Partial<NadleConfigFileOptions> {
		return this.options;
	}
}

export const optionRegistry = new OptionsRegistry();
