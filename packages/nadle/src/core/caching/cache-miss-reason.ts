export type CacheMissReason =
	| { file: string; type: "input-changed" }
	| { file: string; type: "input-removed" }
	| { file: string; type: "input-added" }
	| { type: "no-previous-metadata" };
export namespace CacheMissReason {
	export function toString(reason: CacheMissReason): string {
		switch (reason.type) {
			case "no-previous-metadata":
				return "No previous cache found";
			case "input-changed":
				return `File ${reason.file} was changed`;
			case "input-removed":
				return `File ${reason.file} was removed`;
			case "input-added":
				return `File ${reason.file} was added`;
			default:
				throw new Error(`Unknown cache miss reason: ${JSON.stringify(reason)}`);
		}
	}
}
