import { get } from "lodash-es";

import { BaseHandler } from "./base-handler.js";
import { stringify } from "../utilities/stringify.js";

export class ShowConfigHandler extends BaseHandler {
	public readonly name = "show-config";
	public readonly description = "Shows the current Nadle configuration.";

	public canHandle(): boolean {
		return this.nadle.options.showConfig;
	}

	public handle() {
		const { configKey } = this.nadle.options;

		if (!configKey) {
			this.nadle.logger.log(stringify(this.nadle.options));

			return;
		}

		this.nadle.logger.log(stringify(get(this.nadle.options, configKey)));
	}
}
