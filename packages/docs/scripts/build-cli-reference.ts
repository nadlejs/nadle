import Url from "node:url";
import Path from "node:path";
import Fs from "node:fs/promises";

const outputFile = Path.join(__dirname, "..", "docs", "cli-reference.md");

// `CLIOptions` is not a public export of the `nadle` package, so we import the
// source file directly via tsx. The specifier is built at runtime so the docs
// tsconfig project does not pull `packages/nadle/src/**` across its boundary.
const cliOptionsPath = Path.join(__dirname, "..", "..", "nadle", "src", "core", "options", "cli-options.ts");

async function loadCliOptions(): Promise<Record<string, Entry>> {
	const moduleUrl = Url.pathToFileURL(cliOptionsPath).href;
	const loaded = (await import(moduleUrl)) as { CLIOptions: Record<string, Entry> };

	return loaded.CLIOptions;
}

const FRONTMATTER = [
	"---",
	"description: Complete machine-readable reference of every Nadle CLI flag, its alias, type, default, and description, generated from source.",
	"keywords: [nadle, CLI, flags, options, reference, command line, task runner]",
	"---"
].join("\n");

const HEADER = `# CLI Reference

This page lists every Nadle command-line flag. It is generated from Nadle's source
(\`packages/nadle/src/core/options/cli-options.ts\`), so it always matches the installed version.

## Usage

\`\`\`bash
nadle [tasks...] [options]
\`\`\`

- \`tasks...\` — One or more task names to run, in order. Task names are positional arguments.
  A task may be a bare name (\`build\`) or workspace-qualified (\`docs:build\`).
- \`options\` — Any of the flags listed below.
- \`--\` — Everything after a bare \`--\` is passed through verbatim to the underlying task
  (for example \`nadle test -- --watch\` forwards \`--watch\` to the test runner).

## Flags
`;

const FOOTER = `
## Shell Completion

The \`completion\` command prints a shell completion script (bash, zsh, or fish) to
standard output. Install it by appending the output to your shell profile:

\`\`\`bash
nadle completion >> ~/.zshrc   # or ~/.bashrc, or your fish config
\`\`\`

After reloading your shell, pressing TAB completes both option flags and the live
task names defined by your configuration. In shells that can show a description next
to each candidate (such as zsh), task completions include the task's description,
matching what \`--list\` shows; tasks without a description complete to the bare name.
`;

interface RawOptions {
	type?: string;
	alias?: string;
	array?: boolean;
	hidden?: boolean;
	default?: unknown;
	describe?: string;
	description?: string;
	choices?: readonly string[];
	defaultDescription?: string;
}

interface Entry {
	key: string;
	options: RawOptions;
}

function escapeCell(value: string): string {
	return value.replace(/\|/g, "\\|");
}

function renderFlag(entry: Entry): string {
	const parts = [`\`--${entry.key}\``];

	if (entry.options.alias) {
		parts.push(`\`-${entry.options.alias}\``);
	}

	return parts.join(", ");
}

function renderType(options: RawOptions): string {
	if (options.choices && options.choices.length > 0) {
		const rendered = options.choices.map((choice) => (choice === "" ? "(empty)" : `\`${choice}\``)).join(" \\| ");

		return rendered;
	}

	const base = options.type ?? "string";

	return options.array ? `${base}[]` : base;
}

function renderDefault(options: RawOptions): string {
	if (options.defaultDescription !== undefined) {
		return `\`${options.defaultDescription}\``;
	}

	if (options.default !== undefined) {
		return `\`${JSON.stringify(options.default)}\``;
	}

	return "—";
}

function renderDescription(options: RawOptions): string {
	return options.description ?? options.describe ?? "";
}

async function main() {
	const cliOptions = await loadCliOptions();
	const entries = Object.values(cliOptions).filter((entry) => !entry.options.hidden);

	const rows = entries.map((entry) => {
		const flag = renderFlag(entry);
		const type = renderType(entry.options);
		const def = renderDefault(entry.options);
		const description = escapeCell(renderDescription(entry.options));

		return `| ${flag} | ${type} | ${def} | ${description} |`;
	});

	const table = ["| Flag | Type | Default | Description |", "| --- | --- | --- | --- |", ...rows].join("\n");

	const content = `${FRONTMATTER}\n\n${HEADER}\n${table}\n${FOOTER}`;

	await Fs.writeFile(outputFile, content, "utf-8");

	console.log(`CLI reference generated at packages/docs/docs/cli-reference.md (${entries.length} flags).`);
}

main().catch((error) => {
	console.error("Error building CLI reference.", error);
	// eslint-disable-next-line n/no-process-exit
	process.exit(1);
});
