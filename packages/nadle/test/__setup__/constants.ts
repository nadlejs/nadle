import Path from "node:path";

export const cliPath = Path.resolve(import.meta.dirname, "..", "..", "lib", "cli.js");
export const fixturesDir = Path.resolve(import.meta.dirname, "..", "__fixtures__");
export const defaultConfigFile = "nadle.config.ts";
