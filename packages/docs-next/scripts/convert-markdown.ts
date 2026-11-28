const ADMONITION_OPENER = /^:::(\w+)(?:\[(.*)])?\s*$/;
const FENCE_LINE = /^\s*```/;

/** Docusaurus ":::note" and ":::tip[Title]" openers to VitePress containers. */
function convertAdmonition(line: string): string {
	const opener = ADMONITION_OPENER.exec(line);

	if (!opener) {
		return line;
	}

	const [, kind, title] = opener;
	// VitePress has no "note" container, so it becomes an info container titled "Note".
	const type = kind === "note" ? "info" : kind;
	const label = title ?? (kind === "note" ? "Note" : "");

	return `::: ${type} ${label}`.trimEnd();
}

/** VitePress 1.x shows a fence title only as a code-group tab, so a titled fence gets a one-tab group. */
function convertFenceTitle(line: string): string | undefined {
	const titled = /^(\s*```\w*)\s+title="([^"]+)"/.exec(line);

	return titled ? `${titled[1]} [${titled[2]}]` : undefined;
}

/** Walks the lines once, converting admonitions outside fences and titles on fence openers. */
function convertLines(lines: string[]): string[] {
	let inFence = false;
	let wrapped = false;

	return lines.flatMap((line) => {
		if (!FENCE_LINE.test(line)) {
			return [inFence ? line : convertAdmonition(line)];
		}

		if (inFence) {
			inFence = false;

			return wrapped ? [line, "", ":::"] : [line];
		}

		inFence = true;
		const title = convertFenceTitle(line);

		wrapped = title !== undefined;

		return title ? ["::: code-group", "", title] : [line];
	});
}

/** One <Tabs> block of single-fence tabs to a code-group; anything else is reported. */
function convertTabs(content: string, report: (problem: string) => void): string {
	return content.replace(/<Tabs[^>]*>([\s\S]*?)<\/Tabs>/g, (whole, inner: string) => {
		const items = [...inner.matchAll(/<TabItem[^>]*label="([^"]+)"[^>]*>([\s\S]*?)<\/TabItem>/g)];
		const fences = items.map(([, label, body]) => ({ label, fence: /^```(\w*)\n([\s\S]*?)\n```$/m.exec(body.trim()) }));

		if (items.length === 0 || fences.some(({ fence }) => !fence)) {
			report("Tabs with non-fence content");

			return whole;
		}

		const tabs = fences.map(({ label, fence }) => `\`\`\`${fence?.[1]} [${label}]\n${fence?.[2]}\n\`\`\``);

		return `::: code-group\n\n${tabs.join("\n\n")}\n\n:::`;
	});
}

/** JSX style={{ a: "b" }} to a CSS string; Vue templates reject object literals. */
function convertJsxStyle(content: string): string {
	return content.replace(/style=\{\{([^}]*)}}/g, (_, body: string) => {
		const declarations = body
			.split(",")
			.map((pair) => pair.trim())
			.filter(Boolean)
			.map((pair) => {
				const [key, value] = pair.split(/:(.*)/s).map((part) => part.trim().replace(/^"|"$/g, ""));

				return `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value}`;
			});

		return `style="${declarations.join("; ")}"`;
	});
}

/** Converts one Docusaurus markdown page; constructs it cannot convert go to report. */
export function convertMarkdown(content: string, report: (problem: string) => void): string {
	const lines = content
		.replace(/^import \w+ from ['"]@theme\/\w+['"];?\n+/gm, "")
		.replace(/<!--\s*truncate\s*-->\n*/g, "")
		.split("\n");

	return convertJsxStyle(convertTabs(convertLines(lines).join("\n"), report));
}
