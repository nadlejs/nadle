export function serializeFilePath(input: string) {
	return input.replace(process.cwd(), "/ROOT");
}

const DurationRegex = /(\d+)(ms|s)/g;
export function serializeDuration(input: string) {
	return input.replace(DurationRegex, (_: unknown, _p1: string, p2: string) => {
		return `_${p2}`;
	});
}

// eslint-disable-next-line no-control-regex
const ANSIRegex = /\x1B\[(\d+)(?:;(\d+))?m/g;
export function serializeANSI(input: string) {
	return input.replace(ANSIRegex, (_: unknown, p1: string, p2: string) => {
		const codes = [p1, ...(p2?.split(";") ?? [])].map((e) => {
			if (!Object.keys(ansiCodeMap).includes(e)) {
				throw new Error(`Unknown ANSI code: ${e}`);
			}

			return ansiCodeMap[e];
		});

		return codes.join("");
	});
}

const ansiCodeMap: Record<string, string> = {
	"2": "<Dim>",
	"31": "<Red>",
	"1": "<Bold>",
	"32": "<Green>",
	"33": "<Yellow>",
	"39": "</Color>",
	"49": "</BgColor>",
	"22": "</BoldDim>"
};
