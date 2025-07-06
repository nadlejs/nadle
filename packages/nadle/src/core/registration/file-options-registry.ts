import { type NadleFileOptions } from "../options/types.js";

class FileOptionsRegistry {
	private options: NadleFileOptions = {};

	public add(options: NadleFileOptions) {
		this.options = options;
	}

	public get(): NadleFileOptions {
		return this.options;
	}
}

export const fileOptionsRegistry = new FileOptionsRegistry();
