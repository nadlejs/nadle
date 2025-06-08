import { vi } from "vitest";

export function mockStdEnv(overrides: { isCI: boolean; isTest: boolean }) {
	vi.doMock("std-env", async () => {
		const actual = await vi.importActual("std-env");

		return {
			...actual,
			...overrides
		};
	});
}
