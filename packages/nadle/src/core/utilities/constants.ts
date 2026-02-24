const ESC: string = "\x1B[";
export const ERASE_DOWN: string = `${ESC}J`;
export const ERASE_SCROLLBACK: string = `${ESC}3J`;
export const CURSOR_TO_START: string = `${ESC}1;1H`;
export const HIDE_CURSOR: string = `${ESC}?25l`;
export const CLEAR_SCREEN: string = "\x1Bc";

export const COLON = ":";
export const DOT = ".";
export const UNDERSCORE = "_";
export const CROSS = "×";
export const CHECK = "✓";
export const DASH = "-";
export const CURVE_ARROW = "↩";
export const RIGHT_ARROW = "→";
export const VERTICAL_BAR = "|";

export const LINES = {
	UP_RIGHT: "└",
	VERTICAL: "│",
	HORIZONTAL: "─",
	VERTICAL_RIGHT: "├"
};

export const DEFAULT_CACHE_DIR_NAME = "node_modules/.cache/nadle";
