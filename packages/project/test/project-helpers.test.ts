import { it, expect, describe } from "vitest";

import {
	type Project,
	type Workspace,
	getAllWorkspaces,
	getWorkspaceById,
	configureProject,
	type RootWorkspace,
	getWorkspaceByLabelOrId
} from "../src/index.js";

function createWorkspace(overrides: Partial<Workspace> & { id: string }): Workspace {
	return {
		dependencies: [],
		label: overrides.id,
		configFilePath: null,
		relativePath: `packages/${overrides.id}`,
		absolutePath: `/root/packages/${overrides.id}`,
		packageJson: { version: "1.0.0", name: `@test/${overrides.id}` },
		...overrides
	};
}

function createProject(workspaces: Workspace[] = []): Project {
	const rootWorkspace: RootWorkspace = {
		label: "",
		id: "root",
		dependencies: [],
		relativePath: ".",
		absolutePath: "/root",
		configFilePath: "/root/nadle.config.ts",
		packageJson: { version: "1.0.0", name: "test-root" }
	};

	return {
		workspaces,
		rootWorkspace,
		packageManager: "pnpm",
		currentWorkspaceId: "root"
	};
}

describe("getAllWorkspaces", () => {
	it("should return root workspace plus all sub-workspaces", () => {
		const workspace = createWorkspace({ id: "pkg-a" });
		const project = createProject([workspace]);

		const result = getAllWorkspaces(project);

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe("root");
		expect(result[1].id).toBe("pkg-a");
	});

	it("should return only root workspace when no sub-workspaces", () => {
		const project = createProject();

		const result = getAllWorkspaces(project);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("root");
	});
});

describe("getWorkspaceById", () => {
	it("should find workspace by id", () => {
		const workspace = createWorkspace({ id: "pkg-a" });
		const project = createProject([workspace]);

		const result = getWorkspaceById(project, "pkg-a");

		expect(result.id).toBe("pkg-a");
	});

	it("should find root workspace by id", () => {
		const project = createProject();

		const result = getWorkspaceById(project, "root");

		expect(result.id).toBe("root");
	});

	it("should throw for unknown id", () => {
		const project = createProject();

		expect(() => getWorkspaceById(project, "nonexistent")).toThrow();
	});
});

describe("getWorkspaceByLabelOrId", () => {
	it("should find workspace by id", () => {
		const workspace = createWorkspace({ id: "pkg-a" });
		const project = createProject([workspace]);

		const result = getWorkspaceByLabelOrId(project, "pkg-a");

		expect(result.id).toBe("pkg-a");
	});

	it("should find workspace by label", () => {
		const workspace = createWorkspace({ id: "pkg-a", label: "my-alias" });
		const project = createProject([workspace]);

		const result = getWorkspaceByLabelOrId(project, "my-alias");

		expect(result.id).toBe("pkg-a");
	});

	it("should throw for unknown input", () => {
		const project = createProject();

		expect(() => getWorkspaceByLabelOrId(project, "unknown")).toThrow();
	});
});

describe("configureProject", () => {
	it("should apply alias mapping to workspaces", () => {
		const workspace = createWorkspace({
			id: "pkg-a",
			relativePath: "packages/pkg-a"
		});
		const project = createProject([workspace]);

		const result = configureProject(project, {
			"packages/pkg-a": "my-alias"
		});

		expect(result.workspaces[0].label).toBe("my-alias");
	});

	it("should apply alias function to workspaces", () => {
		const workspace = createWorkspace({
			id: "pkg-a",
			relativePath: "packages/pkg-a"
		});
		const project = createProject([workspace]);

		const result = configureProject(project, (path: string) => (path === "packages/pkg-a" ? "fn-alias" : undefined));

		expect(result.workspaces[0].label).toBe("fn-alias");
	});

	it("should keep workspace id as label when alias not matched", () => {
		const workspace = createWorkspace({
			id: "pkg-a",
			relativePath: "packages/pkg-a"
		});
		const project = createProject([workspace]);

		const result = configureProject(project, {});

		expect(result.workspaces[0].label).toBe("pkg-a");
	});

	it("should set root workspace label to empty string when no alias", () => {
		const project = createProject();

		const result = configureProject(project, {});

		expect(result.rootWorkspace.label).toBe("");
	});
});
