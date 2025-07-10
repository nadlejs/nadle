import stripAnsi from "strip-ansi";
import { type ExpectationResult } from "@vitest/expect";

export function toThrowPlainMessage(received: () => string, expected: string): ExpectationResult {
	try {
		received();
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		const clean = stripAnsi(message);
		const pass = clean.includes(expected);

		return {
			pass,
			message: () =>
				pass ? `Expected error message not to include "${expected}"` : `Expected error message to include "${expected}", but got: "${clean}"`
		};
	}

	return {
		pass: false,
		message: () => "Function did not throw"
	};
}
