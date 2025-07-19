import { type FileFingerprints } from "./fingerprint.js";
import { stringify } from "../../utilities/stringify.js";
import { compareObjects } from "../../utilities/compare-objects.js";

export type CacheMissReason =
	| { type: "no-previous-cache" }
	| { file: string; type: "input-changed" }
	| { file: string; type: "input-removed" }
	| { file: string; type: "input-added" };

export namespace CacheMissReason {
	export function toString(reason: CacheMissReason): string {
		switch (reason.type) {
			case "no-previous-cache":
				return "No previous cache found";
			case "input-changed":
				return `File ${reason.file} was changed`;
			case "input-removed":
				return `File ${reason.file} was removed`;
			case "input-added":
				return `File ${reason.file} was added`;
			default:
				throw new Error(`Unknown cache miss reason: ${stringify(reason)}`);
		}
	}

	export function compute(oldFingerprint: FileFingerprints | undefined, currentFingerPrint: FileFingerprints): CacheMissReason[] {
		if (oldFingerprint === undefined) {
			return [{ type: "no-previous-cache" }];
		}

		return compareObjects(oldFingerprint, currentFingerPrint).map((diff) => {
			if (diff.type === "added-entry") {
				return { type: "input-added", file: diff.newEntry.key };
			}

			if (diff.type === "removed-entry") {
				return { type: "input-removed", file: diff.removedEntry.key };
			}

			if (diff.type === "changed-entry") {
				return { type: "input-changed", file: diff.oldEntry.key };
			}

			throw new Error(`Unknown diff type: ${stringify(diff)}`);
		});
	}
}
