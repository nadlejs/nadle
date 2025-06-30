import { type NadleFileOptions } from "../options/types.js";

class FileOptionsRegistry {
	private options: Partial<NadleFileOptions> = {};

	public add(options: Partial<NadleFileOptions>) {
		this.options = options;
	}

	public get(): Partial<NadleFileOptions> {
		return this.options;
	}
}

export const fileOptionsRegistry = new FileOptionsRegistry();
