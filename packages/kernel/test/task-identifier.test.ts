import { it, expect, describe } from "vitest";

import { parseTaskReference, isWorkspaceQualified, composeTaskIdentifier } from "../src/index.js";

describe("parseTaskReference", () => {
	it("parses bare task name without workspace", () => {
		expect(parseTaskReference("build")).toEqual({ taskName: "build", workspaceInput: undefined });
	});

	it("parses single workspace qualifier", () => {
		expect(parseTaskReference("shared:build")).toEqual({ taskName: "build", workspaceInput: "shared" });
	});

	it("parses nested workspace qualifier", () => {
		expect(parseTaskReference("apps:web:client:build")).toEqual({ taskName: "build", workspaceInput: "apps:web:client" });
	});

	it("parses root workspace reference", () => {
		expect(parseTaskReference("root:build")).toEqual({ taskName: "build", workspaceInput: "root" });
	});
});

describe("composeTaskIdentifier", () => {
	it("composes workspace-qualified identifier", () => {
		expect(composeTaskIdentifier("shared", "build")).toBe("shared:build");
	});

	it("returns bare task name for empty workspace label (root)", () => {
		expect(composeTaskIdentifier("", "build")).toBe("build");
	});

	it("composes nested workspace identifier", () => {
		expect(composeTaskIdentifier("apps:web:client", "build")).toBe("apps:web:client:build");
	});
});

describe("isWorkspaceQualified", () => {
	it("returns false for bare task name", () => {
		expect(isWorkspaceQualified("build")).toBe(false);
	});

	it("returns true for workspace-qualified reference", () => {
		expect(isWorkspaceQualified("shared:build")).toBe(true);
	});

	it("returns true for nested workspace-qualified reference", () => {
		expect(isWorkspaceQualified("apps:web:client:build")).toBe(true);
	});
});
