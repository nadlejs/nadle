import { noop } from "../utils.js";
import { type Renderer } from "./renderer.js";

export class DefaultRenderer implements Renderer {
	start(): void {
		noop();
	}
	finish(): void {
		noop();
	}
	schedule(): void {
		noop();
	}
}
