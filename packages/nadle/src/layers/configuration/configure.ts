import { configsRegistry } from "./configs-registry.js";
import { type NadleConfigFileConfigurations } from "./types.js";

export function configure(configs: Partial<NadleConfigFileConfigurations>) {
	if (typeof configs !== "object" || configs === null) {
		throw new TypeError("Configs must be an object");
	}

	configsRegistry.add(configs);
}
