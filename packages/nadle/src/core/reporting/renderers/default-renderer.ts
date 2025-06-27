import { type Renderer } from "./renderer.js";
import { noop } from "../../utilities/utils.js";

export class DefaultRenderer implements Renderer {
	public start(): void {
		noop();
	}
	public finish(): void {
		noop();
	}
	public schedule(): void {
		noop();
	}
}
