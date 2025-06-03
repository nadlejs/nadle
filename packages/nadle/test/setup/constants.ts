import Path from "node:path";

export const cliPath = Path.resolve(import.meta.dirname, "..", "..", "bin", "nadle");
export const fixturesDir = Path.resolve(import.meta.dirname, "..", "fixtures");

export const defaultConfigFile = "nadle.config.ts";
