const ESC: string = "\x1B[";
export const ERASE_DOWN: string = `${ESC}J`;
export const ERASE_SCROLLBACK: string = `${ESC}3J`;
export const CURSOR_TO_START: string = `${ESC}1;1H`;
export const HIDE_CURSOR: string = `${ESC}?25l`;
export const CLEAR_SCREEN: string = "\x1Bc";

export const SLASH = "/";
export const BACKSLASH = "\\";
export const COLON = ":";
export const DOT = ".";
export const UNDERSCORE = "_";
export const CROSS = "×";
export const CHECK = "✓";
export const DASH = "-";
export const CURVE_ARROW = "↩";
export const RIGHT_ARROW = "→";
export const VERTICAL_BAR = "|";

export const PACKAGE_JSON = "package.json";
const BASE_CONFIG_FILE_NAME = "nadle.config";
export const SUPPORT_EXTENSIONS = ["js", "mjs", "ts", "mts"];
export const DEFAULT_CONFIG_FILE_NAMES = SUPPORT_EXTENSIONS.map((ext) => `${BASE_CONFIG_FILE_NAME}.${ext}`);
export const CONFIG_FILE_PATTERN = `${BASE_CONFIG_FILE_NAME}.{${SUPPORT_EXTENSIONS.join(",")}}`;

export const DEFAULT_CACHE_DIR_NAME = ".nadle";
