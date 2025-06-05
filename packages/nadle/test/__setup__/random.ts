import { randomBytes } from "node:crypto";

export function randomHash(length = 4, options?: { doubleScores?: boolean }): string {
	const doubleScores = options?.doubleScores ?? true;

	const hash = randomBytes(length).toString("hex");

	if (!doubleScores) {
		return hash;
	}

	return `__${hash}__`;
}
