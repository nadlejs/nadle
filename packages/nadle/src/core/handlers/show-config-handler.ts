import { BaseHandler } from "./base-handler.js";

export class ShowConfigHandler extends BaseHandler {
	public readonly name = "show-config";
	public readonly description = "Shows the current Nadle configuration.";

	public canHandle(): boolean {
		return this.nadle.options.showConfig;
	}

	public handle() {
		this.nadle.logger.log(JSON.stringify(this.nadle.options, null, 2));
	}
}
