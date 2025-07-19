import Path from "node:path";

import PackageJson from "../../package.json" with { type: "json" };

const rootPackage = Path.resolve(import.meta.dirname, "..", "..");
export const cliPath = Path.resolve(rootPackage, PackageJson.bin);
export const fixturesDir = Path.resolve(rootPackage, "test", "__fixtures__");
export const tempDir = Path.resolve(rootPackage, "test", "__temp__");
export const CONFIG_FILE = `nadle.config.ts`;
export const PNPM_WORKSPACE = "pnpm-workspace.yaml";
export const PACKAGE_LOCK_JSON = "package-lock.json";
