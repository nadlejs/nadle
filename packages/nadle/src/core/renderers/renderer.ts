export interface Renderer {
	start(): void;
	finish(): void;
	schedule(): void;
}
