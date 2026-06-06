import type fixturify from "fixturify";
import { PACKAGE_JSON } from "@nadle/project-resolver";
import { type PackageJson } from "@nadle/project-resolver";
import { type NadleFileOptions, type TaskConfiguration } from "src/index.js";

import { CONFIG_FILE, PNPM_WORKSPACE } from "./constants.js";
import { createNadleConfig, createPackageJson, createPnpmWorkspace } from "./create-files.js";

type PackageFields = Partial<Omit<PackageJson & { workspaces: string[] }, "name">>;

interface WorkspaceSpec {
	/** package.json name; defaults to the last segment of the workspace path. */
	name?: string;
	/** Write the config file verbatim instead of generating it (e.g. a task body with real code). */
	rawConfig?: string;
	/** package.json fields beyond `name` (version, dependencies, devDependencies, ...). */
	pkg?: PackageFields;
	/** Config file name; defaults to nadle.config.ts. Use for ".js" or custom-named configs. */
	configFileName?: string;
	/** `configure({...})` options. Pass a function alias here; it is serialized verbatim. */
	configure?: NadleFileOptions;
	/** Extra files/dirs to merge into this workspace (src/, lock files, nested config dirs, ...). */
	extraFiles?: fixturify.DirJSON;
	/** Tasks to register. Omit (and omit rawConfig) for a package-only workspace. */
	tasks?: { name: string; config?: TaskConfiguration }[];
}

interface WorkspaceFixtureOptions {
	root?: WorkspaceSpec;
	/** pnpm-workspace.yaml packages globs; pass false to omit the file (npm/yarn roots). */
	pnpmWorkspace?: string[] | false;
	/**
	 * Workspaces keyed by directory path relative to the root. Slash-separated paths
	 * (e.g. "common/api") create nested directories. A `null` value writes only a
	 * package.json (named after the last path segment) with no config.
	 */
	workspaces?: Record<string, WorkspaceSpec | null>;
}

function buildWorkspaceFiles(defaultName: string, spec: WorkspaceSpec): fixturify.DirJSON {
	const files: fixturify.DirJSON = {
		[PACKAGE_JSON]: createPackageJson(spec.name ?? defaultName, spec.pkg)
	};

	if (spec.rawConfig !== undefined) {
		files[spec.configFileName ?? CONFIG_FILE] = spec.rawConfig;
	} else if (spec.tasks || spec.configure) {
		files[spec.configFileName ?? CONFIG_FILE] = createNadleConfig({ tasks: spec.tasks, configure: spec.configure });
	}

	return { ...files, ...spec.extraFiles };
}

function setNestedDir(root: fixturify.DirJSON, path: string, contents: fixturify.DirJSON): void {
	const parts = path.split("/");
	let current = root;

	for (const part of parts.slice(0, -1)) {
		if (typeof current[part] !== "object") {
			current[part] = {};
		}

		current = current[part] as fixturify.DirJSON;
	}

	current[parts.at(-1)!] = contents;
}

/**
 * Build a monorepo fixture tree: a root workspace plus N nested workspaces, each
 * with a package.json and (optionally) a nadle config. Replaces the hand-rolled
 * createPnpmWorkspace + createPackageJson + createNadleConfig triplet repeated
 * across the workspace tests.
 */
export function workspaceFixture(options: WorkspaceFixtureOptions = {}): fixturify.DirJSON {
	const { root = {}, workspaces = {}, pnpmWorkspace = ["./**"] } = options;

	const files: fixturify.DirJSON = { ...buildWorkspaceFiles("root", root) };

	if (pnpmWorkspace !== false) {
		files[PNPM_WORKSPACE] = createPnpmWorkspace(pnpmWorkspace);
	}

	for (const [path, spec] of Object.entries(workspaces)) {
		const name = path.split("/").at(-1)!;

		setNestedDir(files, path, buildWorkspaceFiles(name, spec ?? {}));
	}

	return files;
}
