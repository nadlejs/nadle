import { type DirDeclaration, type FileDeclaration } from "./declaration.js";

export namespace Inputs {
	export function files(...patterns: string[]): FileDeclaration {
		return { patterns, type: "file" };
	}

	export function dirs(...patterns: string[]): DirDeclaration {
		return { patterns, type: "dir" };
	}
}
