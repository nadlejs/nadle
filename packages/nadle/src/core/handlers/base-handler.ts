import { type Nadle } from "../nadle.js";
import { type Awaitable } from "../utilities/types.js";
import { type Handler } from "../interfaces/handler.js";

export abstract class BaseHandler implements Handler {
	public constructor(protected readonly nadle: Nadle) {}

	public abstract readonly name: string;
	public abstract readonly description: string;

	public abstract canHandle(): boolean;
	public abstract handle(...args: unknown[]): Awaitable<void>;
}
