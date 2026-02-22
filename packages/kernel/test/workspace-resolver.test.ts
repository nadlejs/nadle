import { it, expect, describe } from "vitest";

import { getWorkspaceById, resolveWorkspace, type WorkspaceIdentity, validateWorkspaceLabels } from "../src/index.js";

const workspaces: WorkspaceIdentity[] = [
	{ label: "", id: "root", relativePath: "." },
	{ label: "foo", id: "packages:foo", relativePath: "packages/foo" },
	{ label: "bar", id: "packages:bar", relativePath: "packages/bar" }
];

describe("resolveWorkspace", () => {
	it("resolves by workspace ID", () => {
		expect(resolveWorkspace("packages:foo", workspaces)).toEqual(workspaces[1]);
	});

	it("resolves by workspace label", () => {
		expect(resolveWorkspace("foo", workspaces)).toEqual(workspaces[1]);
	});

	it("throws when workspace is not found", () => {
		expect(() => resolveWorkspace("nonexistent", workspaces)).toThrow();
	});

	it("preserves consumer's extended type", () => {
		interface ExtendedWorkspace extends WorkspaceIdentity {
			readonly absolutePath: string;
		}

		const extended: ExtendedWorkspace[] = [{ label: "foo", id: "packages:foo", relativePath: "packages/foo", absolutePath: "/root/packages/foo" }];

		const result = resolveWorkspace("foo", extended);
		expect(result.absolutePath).toBe("/root/packages/foo");
	});
});

describe("getWorkspaceById", () => {
	it("finds workspace by exact ID", () => {
		expect(getWorkspaceById("packages:bar", workspaces)).toEqual(workspaces[2]);
	});

	it("throws when ID not found", () => {
		expect(() => getWorkspaceById("nonexistent", workspaces)).toThrow();
	});

	it("preserves consumer's extended type", () => {
		interface ExtendedWorkspace extends WorkspaceIdentity {
			readonly configFilePath: string;
		}

		const extended: ExtendedWorkspace[] = [{ label: "foo", id: "packages:foo", relativePath: "packages/foo", configFilePath: "nadle.config.ts" }];

		const result = getWorkspaceById("packages:foo", extended);
		expect(result.configFilePath).toBe("nadle.config.ts");
	});
});

describe("validateWorkspaceLabels", () => {
	it("passes with unique labels", () => {
		expect(() => validateWorkspaceLabels(workspaces)).not.toThrow();
	});

	it("throws when two workspaces share the same label", () => {
		const duplicateLabels: WorkspaceIdentity[] = [
			{ label: "shared", id: "packages:foo", relativePath: "packages/foo" },
			{ label: "shared", id: "packages:bar", relativePath: "packages/bar" }
		];

		expect(() => validateWorkspaceLabels(duplicateLabels)).toThrow();
	});

	it("throws when a label conflicts with another workspace's ID", () => {
		const conflicting: WorkspaceIdentity[] = [
			{ id: "packages:foo", label: "packages:bar", relativePath: "packages/foo" },
			{ label: "bar", id: "packages:bar", relativePath: "packages/bar" }
		];

		expect(() => validateWorkspaceLabels(conflicting)).toThrow();
	});

	it("allows root workspace with empty label", () => {
		const withRoot: WorkspaceIdentity[] = [
			{ label: "", id: "root", relativePath: "." },
			{ label: "foo", id: "packages:foo", relativePath: "packages/foo" }
		];

		expect(() => validateWorkspaceLabels(withRoot)).not.toThrow();
	});

	it("throws when non-root workspace has empty label", () => {
		const emptyLabel: WorkspaceIdentity[] = [{ label: "", id: "packages:foo", relativePath: "packages/foo" }];

		expect(() => validateWorkspaceLabels(emptyLabel)).toThrow();
	});
});
