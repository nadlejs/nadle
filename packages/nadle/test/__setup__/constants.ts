import Path from "node:path";

import PackageJson from "../../package.json" with { type: "json" };
import { OptionsResolver } from "../../src/core/options/options-resolver.js";

const rootPackage = Path.resolve(import.meta.dirname, "..", "..");
export const cliPath = Path.resolve(rootPackage, PackageJson.bin);
export const fixturesDir = Path.resolve(rootPackage, "test", "__fixtures__");
export const tempDir = Path.resolve(rootPackage, "test", "__temp__");
export const defaultConfigFile = `${OptionsResolver.DEFAULT_CONFIG_FILE_NAME}.ts`;
