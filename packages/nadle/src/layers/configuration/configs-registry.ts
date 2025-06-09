import { type NadleConfigFileConfigurations } from "./types.js";

class ConfigurationsRegistry {
	private configs: Partial<NadleConfigFileConfigurations> = {};

	add(configs: Partial<NadleConfigFileConfigurations>) {
		this.configs = configs;
	}

	get(): Partial<NadleConfigFileConfigurations> {
		return this.configs;
	}
}

export const configsRegistry = new ConfigurationsRegistry();
