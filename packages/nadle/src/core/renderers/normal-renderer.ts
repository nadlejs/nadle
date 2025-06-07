import { noop } from "../utils.js";
import { type Renderer } from "./renderer.js";

export class NormalRenderer implements Renderer {
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
