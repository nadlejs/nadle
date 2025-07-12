import { type Nadle } from "../nadle.js";
import { type Awaitable } from "../utilities/types.js";

export type HandlerConstructor = new (nadle: Nadle) => Handler;

export interface Handler {
	/**
	 * Returns the name of the handler.
	 */
	readonly name: string;

	/**
	 * Returns a description of the handler.
	 */
	readonly description: string;

	/**
	 * Checks if the handler can handle the given command.
	 * @returns True if the handler can handle the command, false otherwise.
	 */
	canHandle(): boolean;

	/**
	 * Handles the command with the given arguments.
	 * @param args The arguments passed to the command.
	 */
	handle(...args: unknown[]): Awaitable<void>;
}
