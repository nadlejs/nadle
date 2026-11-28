export type TokenKind = "plain" | "keyword" | "string" | "comment";

export interface Token {
	text: string;
	kind: TokenKind;
}

const KEYWORDS = new Set(["import", "from", "const", "interface", "async", "true", "false"]);
const PATTERN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|([A-Za-z_$][\w$]*)/g;

/** Small regex tokenizer: enough for the short TypeScript samples on the landing page. */
export function tokenizeLine(line: string): Token[] {
	const tokens: Token[] = [];
	let cursor = 0;

	for (const match of line.matchAll(PATTERN)) {
		const start = match.index;

		if (start > cursor) {
			tokens.push({ kind: "plain", text: line.slice(cursor, start) });
		}

		const [text, comment, string, word] = match;
		const kind: TokenKind = comment ? "comment" : string ? "string" : word && KEYWORDS.has(word) ? "keyword" : "plain";

		tokens.push({ kind, text });
		cursor = start + text.length;
	}

	if (cursor < line.length) {
		tokens.push({ kind: "plain", text: line.slice(cursor) });
	}

	return tokens;
}
