import Path from "node:path";

import PackageJson from "../../package.json" with { type: "json" };
import { DEFAULT_CONFIG_FILE_NAME } from "../../src/core/constants.js";

const rootPackage = Path.resolve(import.meta.dirname, "..", "..");
export const cliPath = Path.resolve(rootPackage, PackageJson.bin);
export const fixturesDir = Path.resolve(rootPackage, "test", "__fixtures__");
export const defaultConfigFile = `${DEFAULT_CONFIG_FILE_NAME}.ts`;
