import Path from "node:path";

/** Value of a `--name <value>` argument, resolved against the working directory. */
export function readPathOption(name: string): string | undefined {
	const index = process.argv.indexOf(`--${name}`);
	const value = index === -1 ? undefined : process.argv[index + 1];

	return value === undefined ? undefined : Path.resolve(value);
}
