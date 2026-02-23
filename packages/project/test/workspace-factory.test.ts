import { it, expect, describe } from "vitest";

import { createWorkspace } from "../src/index.js";

describe("createWorkspace", () => {
	it("should create a workspace from a package", () => {
		const pkg = {
			dir: "/root/packages/my-lib",
			relativeDir: "packages/my-lib",
			packageJson: {
				version: "1.0.0",
				name: "@test/my-lib",
				dependencies: { lodash: "^4.0.0" },
				devDependencies: { vitest: "^1.0.0" }
			}
		};

		const workspace = createWorkspace(pkg);

		expect(workspace.id).toBe("packages:my-lib");
		expect(workspace.label).toBe("packages:my-lib");
		expect(workspace.relativePath).toBe("packages/my-lib");
		expect(workspace.absolutePath).toBe("/root/packages/my-lib");
		expect(workspace.dependencies).toEqual([]);
		expect(workspace.configFilePath).toBeNull();
		expect(workspace.packageJson.name).toBe("@test/my-lib");
		expect(workspace.packageJson.version).toBe("1.0.0");
	});

	it("should normalize backslashes in relative path", () => {
		const pkg = {
			dir: "/root/packages/my-lib",
			relativeDir: "packages\\my-lib",
			packageJson: { version: "1.0.0", name: "@test/my-lib" }
		};

		const workspace = createWorkspace(pkg);

		expect(workspace.relativePath).toBe("packages/my-lib");
	});
});
