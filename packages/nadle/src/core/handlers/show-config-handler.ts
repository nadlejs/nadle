import { get } from "lodash-es";

import { BaseHandler } from "./base-handler.js";
import { stringify } from "../utilities/stringify.js";

export class ShowConfigHandler extends BaseHandler {
	public readonly name = "show-config";
	public readonly description = "Shows the current Nadle configuration.";

	public canHandle(): boolean {
		return this.context.options.showConfig;
	}

	public handle() {
		const { configKey } = this.context.options;

		if (!configKey) {
			this.context.logger.log(stringify(this.context.options));

			return;
		}

		this.context.logger.log(stringify(get(this.context.options, configKey)));
	}
}
