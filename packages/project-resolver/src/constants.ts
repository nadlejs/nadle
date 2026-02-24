export const PACKAGE_JSON = "package.json";

const BASE_CONFIG_FILE_NAME = "nadle.config";

export const SUPPORT_EXTENSIONS = ["js", "mjs", "ts", "mts"];

export const DEFAULT_CONFIG_FILE_NAMES = SUPPORT_EXTENSIONS.map((ext) => `${BASE_CONFIG_FILE_NAME}.${ext}`);

export const CONFIG_FILE_PATTERN = `${BASE_CONFIG_FILE_NAME}.{${SUPPORT_EXTENSIONS.join(",")}}`;
