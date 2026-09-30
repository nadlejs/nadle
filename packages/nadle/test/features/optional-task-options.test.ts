import { it, expect, describe } from "vitest";
import { fixture, getStdout, withGeneratedFixture } from "setup";

/**
 * A task whose options have no required fields can be registered without an
 * options resolver. At runtime the resolver defaults to `() => ({})`, so the
 * task receives an empty options object.
 */
const config = `import { tasks, type Task } from "nadle";

interface GreetOptions {
	readonly name?: string;
}

const GreetTask: Task<GreetOptions> = {
	run: ({ options, context }) => {
		context.logger.log(\`Hello \${options.name ?? "world"}\`);
	}
};

tasks.register("greet", { run: GreetTask });
`;

describe.concurrent("optional task options", () => {
	it("runs an options task registered without a resolver", () =>
		withGeneratedFixture({
			files: fixture().packageJson("optional-options").configRaw(config).build(),
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`greet`);

				expect(stdout).toRun("greet");
				expect(stdout).toContain("Hello world");
			}
		}));
});
