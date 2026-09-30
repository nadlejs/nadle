import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { config, settle, fixture, readConfig, withGeneratedFixture } from "setup";

interface StructuredError {
	task?: string;
	message: string;
	errorType: string;
	errorCode: number;
}

/** Find the single JSON error record emitted on stderr, if any. */
function parseStructuredError(stderr: string): StructuredError | undefined {
	for (const line of stripAnsi(stderr).split("\n")) {
		const trimmed = line.trim();

		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			return JSON.parse(trimmed) as StructuredError;
		}
	}

	return undefined;
}

const simple = fixture().packageJson("structured-error").config(config().task("build")).build();
const invalidConfig = fixture()
	.packageJson("structured-error-config")
	.config(config().configure({ logLevel: "verbose" }).task("build"))
	.build();
const failing = fixture()
	.packageJson("structured-error-failing")
	.configRaw(await readConfig("failing-chain.ts"))
	.build();

describe("structured error output", () => {
	it("emits a structured TaskNotFoundError on stderr under --reporter agent", () =>
		withGeneratedFixture({
			files: simple,
			testFn: async ({ exec }) => {
				const result = await settle(exec`nope --reporter agent`);

				expect(result.exitCode).toBe(3);

				const structured = parseStructuredError(result.stderr);

				expect(structured).toBeDefined();
				expect(structured?.errorCode).toBe(3);
				expect(structured?.errorType).toBe("TaskNotFoundError");
				expect(structured?.message).toContain("not found");
				expect(structured?.task).toBeUndefined();
			}
		}));

	it("emits a structured ConfigurationError on stderr under --reporter agent", () =>
		withGeneratedFixture({
			files: invalidConfig,
			testFn: async ({ exec }) => {
				const result = await settle(exec`build --reporter agent`);

				expect(result.exitCode).toBe(2);

				const structured = parseStructuredError(result.stderr);

				expect(structured?.errorCode).toBe(2);
				expect(structured?.errorType).toBe("ConfigurationError");
				expect(structured?.task).toBeUndefined();
			}
		}));

	it("includes the failing task label for a task-execution failure", () =>
		withGeneratedFixture({
			files: failing,
			testFn: async ({ exec }) => {
				const result = await settle(exec`flaky --reporter agent`);

				expect(result.exitCode).toBe(1);

				const structured = parseStructuredError(result.stderr);

				expect(structured?.errorCode).toBe(1);
				expect(structured?.errorType).toBe("TaskExecutionError");
				expect(structured?.task).toBe("flaky");
			}
		}));

	it("emits no structured error with the default reporter", () =>
		withGeneratedFixture({
			files: simple,
			testFn: async ({ exec }) => {
				const result = await settle(exec`nope`);

				expect(result.exitCode).toBe(3);
				expect(parseStructuredError(result.stderr)).toBeUndefined();
			}
		}));
});
