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
	let lastTextColor = "";
	let lastBgColor = "";

	return input.replace(ANSIRegex, (_: unknown, p1: string, p2: string) => {
		const codes = [p1, ...(p2?.split(";") ?? [])].map((code) => {
			const number = parseInt(code, 10);

			if (!Object.keys(ansiCodeMap).includes(code)) {
				throw new Error(`Unknown ANSI code: ${code}`);
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

const ansiCodeMap: Record<string, string> = {
	"2": "<Dim>",
	"1": "<Bold>",
	"22": "</BoldDim>",

	"31": "<Red>",
	"32": "<Green>",
	"33": "<Yellow>",

	"39": "</Color>",
	"49": "</BgColor>"
};
