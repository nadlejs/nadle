import Path from "node:path";
import Fs from "node:fs/promises";

import { findUp } from "find-up";
import Prefer from "preferred-pm";

import { parseScripts } from "./migrate.js";
import type { PackageManager, ProjectContext } from "./types.js";

const LOCK_FILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "pnpm-workspace.yaml"];

const CONFIG_FILES = ["nadle.config.ts", "nadle.config.js", "nadle.config.mjs", "nadle.config.mts"];

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await Fs.access(filePath);

		return true;
	} catch {
		return false;
	}
}

async function detectRoot(cwd: string): Promise<string> {
	const found = await findUp(LOCK_FILES, { cwd });

	return found ? Path.dirname(found) : cwd;
}

async function detectPackageManager(rootDir: string): Promise<PackageManager> {
	const result = await Prefer(rootDir);

	if (result && (result.name === "pnpm" || result.name === "npm" || result.name === "yarn")) {
		return result.name;
	}

	return "npm";
}

async function detectTypeScript(rootDir: string): Promise<boolean> {
	return fileExists(Path.join(rootDir, "tsconfig.json"));
}

async function detectMonorepo(rootDir: string): Promise<boolean> {
	const hasPnpmWorkspace = await fileExists(Path.join(rootDir, "pnpm-workspace.yaml"));

	if (hasPnpmWorkspace) {
		return true;
	}

	const packageJson = await readPackageJson(rootDir);

	return Array.isArray(packageJson["workspaces"]);
}

function detectExistingNadle(packageJson: Record<string, unknown>): boolean {
	const devDeps = packageJson["devDependencies"];
	const deps = packageJson["dependencies"];

	const hasInDev = typeof devDeps === "object" && devDeps !== null && "nadle" in devDeps;
	const hasInDeps = typeof deps === "object" && deps !== null && "nadle" in deps;

	return hasInDev || hasInDeps;
}

async function detectExistingConfig(rootDir: string): Promise<boolean> {
	const checks = CONFIG_FILES.map((file) => fileExists(Path.join(rootDir, file)));
	const results = await Promise.all(checks);

	return results.some(Boolean);
}

async function readPackageJson(rootDir: string): Promise<Record<string, unknown>> {
	const filePath = Path.join(rootDir, "package.json");

	try {
		const content = await Fs.readFile(filePath, "utf8");

		return JSON.parse(content) as Record<string, unknown>;
	} catch {
		return {};
	}
}

/** Detect the project context by scanning from the given directory. */
export async function detectProject(cwd: string): Promise<ProjectContext> {
	const rootDir = await detectRoot(cwd);
	const packageJson = await readPackageJson(rootDir);

	const hasNadle = detectExistingNadle(packageJson);

	const [packageManager, hasTypeScript, isMonorepo, hasConfig] = await Promise.all([
		detectPackageManager(rootDir),
		detectTypeScript(rootDir),
		detectMonorepo(rootDir),
		detectExistingConfig(rootDir)
	]);

	const rawScripts = (packageJson["scripts"] ?? {}) as Record<string, string>;
	const scripts = parseScripts(rawScripts, packageManager);

	return {
		rootDir,
		scripts,
		hasNadle,
		hasConfig,
		isMonorepo,
		packageJson,
		hasTypeScript,
		packageManager
	};
}
