export const UnnamedGroup = "Unnamed";

export const ESC: string = "\x1B[";
export const ERASE_DOWN: string = `${ESC}J`;
export const ERASE_SCROLLBACK: string = `${ESC}3J`;
export const CURSOR_TO_START: string = `${ESC}1;1H`;
export const HIDE_CURSOR: string = `${ESC}?25l`;
export const SHOW_CURSOR: string = `${ESC}?25h`;
export const CLEAR_SCREEN: string = "\x1Bc";
