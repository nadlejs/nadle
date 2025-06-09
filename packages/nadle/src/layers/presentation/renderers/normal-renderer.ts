import { type Renderer } from "./renderer.js";
import { noop } from "../../utilities/utils.js";

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
