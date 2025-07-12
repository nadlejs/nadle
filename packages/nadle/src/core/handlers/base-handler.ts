import { type Nadle } from "../nadle.js";
import { type Awaitable } from "../utilities/types.js";
import { type Handler } from "../interfaces/handler.js";

export class BaseHandler implements Handler {
	public constructor(protected readonly nadle: Nadle) {}

	public name = "base-handler";
	public description = "Base handler for Nadle commands.";

	public canHandle(): boolean {
		throw new Error("Method canHandle not implemented.");
	}

	public handle(): Awaitable<void> {
		throw new Error("Method handle not implemented.");
	}
}
