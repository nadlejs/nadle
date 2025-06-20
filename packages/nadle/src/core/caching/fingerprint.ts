export type FileFingerprints = {
	[filePath: string]: string;
};

export namespace Fingerprint {
	export function compare(firstFingerprints: FileFingerprints, secondFingerprints: FileFingerprints): boolean {
		const firstKeys = Object.keys(firstFingerprints);
		const secondKeys = Object.keys(secondFingerprints);

		if (firstKeys.length !== secondKeys.length) {
			return false;
		}

		for (const key of firstKeys) {
			if (firstFingerprints[key] !== secondFingerprints[key]) {
				return false;
			}
		}

		return true;
	}
}
