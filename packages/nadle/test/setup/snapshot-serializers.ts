import Path from "node:path";

const UnstableWordsMap = [["worker_default", "default"]];

export function serializeUnstableWords(input: string) {
	for (const [word, replacement] of UnstableWordsMap) {
		input = input.replaceAll(word, replacement);
	}

	return input;
}

const UnstableLines = ["ExperimentalWarning", "--trace-warnings"];

export function removeUnstableLines(input: string) {
	return input
		.split("\n")
		.filter((line) => !UnstableLines.some((unstableLine) => line.includes(unstableLine)))
		.join("\n");
}

export function serializeVersion(input: string) {
	return input.replace(/([v@])\d+\.\d+\.\d+/g, "{version}");
}

export function serializeLibFilePath(input: string) {
	return input.replaceAll(/^.*ROOT\/lib\/.*(?:\r?\n)?/gm, "");
}

export function serializeFilePath(input: string) {
	const cwd = process.cwd();
	const rootPath = Path.join(cwd, "..", "..");

	return input.replaceAll(cwd, "/ROOT").replaceAll(rootPath, "/REPO_ROOT");
}

export function serializeFileLocation(input: string) {
	return input.replaceAll(/(\w+(\.\w)?):(\d+):(\d+)/g, (_match, file) => {
		return `${file}:{line}:{column}`;
	});
}

export function serializeHash(input: string) {
	return input.replaceAll(/__[0-9a-f]+__/gi, `__{hash}__`);
}

const DurationRegex = /(\d+(\.\d+)?(ms|s))+/g;
export function serializeDuration(input: string) {
	return input.replace(DurationRegex, "{duration}");
}

// eslint-disable-next-line no-control-regex
const ANSIRegex = /\x1B\[(\d+)(?:;(\d+))?m/g;
export function serializeANSI(input: string) {
	let lastTextColor = "";
	let lastBgColor = "";

	return input.replace(ANSIRegex, (_: unknown, p1: string, p2: string) => {
		const codes = [p1, ...(p2?.split(";") ?? [])].map((code) => {
			const number = parseInt(code, 10);

			if (!Object.keys(ansiCodeMap).includes(code)) {
				throw new Error(`Unknown ANSI code: ${code}. Please update the ANSI code map.`);
			}

			const result = ansiCodeMap[code];

			if (30 <= number && number <= 37) {
				lastTextColor = result.replace(/\W/g, "");
			} else if (40 <= number && number <= 47) {
				lastBgColor = result.replace(/\W/g, "");
			} else if (number === 39) {
				return `</${lastTextColor}>`;
			} else if (number === 49) {
				return `</${lastBgColor}>`;
			}

			return result;
		});

		return codes.join("");
	});
}

/* eslint-disable perfectionist/sort-objects */
const ansiCodeMap: Record<string, string> = {
	"0": "</Reset>",
	"7": "</Inverse>",

	"1": "<Bold>",
	"2": "<Dim>",
	"22": "</BoldDim>",

	"31": "<Red>",
	"32": "<Green>",
	"33": "<Yellow>",
	"34": "<Blue>",
	"36": "<Cyan>",

	"39": "</Color>",
	"49": "</BgColor>",

	"90": "<BrightBlack>",
	"91": "<BrightRed>",
	"93": "<BrightYellow>",

	"96": "<BrightCyan>",
	"106": "</BrightCyan>"
};
/* eslint-enable perfectionist/sort-objects */
