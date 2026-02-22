import { it, expect, describe } from "vitest";

import { ROOT_WORKSPACE_ID, deriveWorkspaceId, isRootWorkspaceId } from "../src/index.js";

describe("deriveWorkspaceId", () => {
	it("converts forward-slash path to colon-separated ID", () => {
		expect(deriveWorkspaceId("packages/foo")).toBe("packages:foo");
	});

	it("converts nested path to colon-separated ID", () => {
		expect(deriveWorkspaceId("apps/web/client")).toBe("apps:web:client");
	});

	it("normalizes Windows backslashes", () => {
		expect(deriveWorkspaceId("packages\\foo")).toBe("packages:foo");
	});

	it("normalizes mixed separators", () => {
		expect(deriveWorkspaceId("apps\\web/client")).toBe("apps:web:client");
	});

	it("returns root workspace ID for dot path", () => {
		expect(deriveWorkspaceId(".")).toBe(ROOT_WORKSPACE_ID);
	});
});

describe("isRootWorkspaceId", () => {
	it("returns true for root workspace ID", () => {
		expect(isRootWorkspaceId("root")).toBe(true);
	});

	it("returns false for non-root workspace ID", () => {
		expect(isRootWorkspaceId("packages:foo")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isRootWorkspaceId("")).toBe(false);
	});
});

describe("ROOT_WORKSPACE_ID", () => {
	it("is 'root'", () => {
		expect(ROOT_WORKSPACE_ID).toBe("root");
	});
});
