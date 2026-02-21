export function serialize(input: string): string {
	return [
		serializeANSI,
		serializeDuration,
		serializeErrorPointer,
		serializeFileLocation,
		serializePwdGitBashWindows,
		serializeRelativePath,
		serializeAbsoluteFilePath,
		serializeStackTrace,
		serializeHash,
		serializeVersion,
		removeUnstableLines,
		removeTrailingSpaces
	].reduce((result, serializer) => serializer(result), input);
}

function removeTrailingSpaces(input: string) {
	return input
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n");
}

const UnstableLines = ["ExperimentalWarning", "--trace-warnings", "npm warn"];

function removeUnstableLines(input: string) {
	return input
		.split("\n")
		.filter((line) => !UnstableLines.some((unstableLine) => line.includes(unstableLine)))
		.join("\n");
}

function serializeVersion(input: string) {
	return input.replace(/([v@])\d+\.\d+\.\d+/g, "{version}");
}

function serializePwdGitBashWindows(input: string) {
	return input.replaceAll(/(?<=\s|^)\/[a-z](\/[a-zA-Z_0-9-]+)+/g, (match) => {
		const [_empty, driveLetter, ...rest] = match.split("/");

		return [`${driveLetter.toUpperCase()}:`, ...rest].join(`\\`);
	});
}

function serializeRelativePath(input: string) {
	return input.replaceAll(/(\s|^)\.[\\/].+/g, (match) => match.replaceAll(`\\`, "/"));
}

function serializeAbsoluteFilePath(input: string) {
	return input
		.replaceAll("\\\\", "\\")
		.replaceAll(process.cwd(), "/ROOT")
		.replace(/\/ROOT\S+/g, (match) => match.replaceAll(`\\`, "/"));
}

function serializeStackTrace(input: string) {
	return input.replaceAll(/at .+( .+)?(\s+at .+( .+)?)+/g, "{stackTrace...}");
}

function serializeHash(input: string) {
	return input.replaceAll(/__[0-9a-f]+__/gi, `__{hash}__`);
}

const DurationRegex = /(\d+(\.\d+)?(ms|s))+/g;
function serializeDuration(input: string) {
	return input.replace(DurationRegex, "{duration}");
}

const FileLocationRegex = /file:\/\/\/\S+(:\d+){1,2}/g;
function serializeFileLocation(input: string) {
	return input.replace(FileLocationRegex, "{file}:{location}");
}

const ErrorPointerRegex = /\s+throw new Error\(.+\);\s+\^/g;
function serializeErrorPointer(input: string) {
	return input.replaceAll(ErrorPointerRegex, "\n{ErrorPointer}");
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
