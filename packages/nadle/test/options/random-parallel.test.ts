import { it, expect, describe } from "vitest";
import { fixture, getStdout, withGeneratedFixture } from "setup";

/**
 * Generates a random DAG of `size` tasks. Task `i` may depend on any subset of
 * tasks with a smaller index, which guarantees the graph stays acyclic.
 * Returns the config source and the list of `[dependency, dependent]` edges.
 */
function randomGraph(size: number): { config: string; edges: [string, string][] } {
	const names = Array.from({ length: size }, (_, index) => `task${index}`);
	const edges: [string, string][] = [];
	const lines = ['import { tasks } from "nadle";', ""];

	for (let index = 0; index < size; index++) {
		const dependencies = names.slice(0, index).filter(() => Math.random() < 0.5);

		for (const dependency of dependencies) {
			edges.push([dependency, names[index]!]);
		}

		if (dependencies.length === 0) {
			lines.push(`tasks.register("${names[index]}");`);
		} else {
			lines.push(`tasks.register("${names[index]}").config({ dependsOn: ${JSON.stringify(dependencies)} });`);
		}
	}

	return { edges, config: lines.join("\n") + "\n" };
}

describe.concurrent("--parallel (randomized)", () => {
	for (let iteration = 1; iteration <= 5; iteration++) {
		it(`respects dependency order under parallel execution ${iteration}`, async () => {
			const size = 6 + Math.floor(Math.random() * 5); // 6..10 tasks
			const maxWorkers = 1 + Math.floor(Math.random() * 4); // 1..4 workers
			const { edges, config } = randomGraph(size);

			const files = fixture().packageJson("random-parallel").configRaw(config).build();
			const targets = Array.from({ length: size }, (_, index) => `task${index}`).join(" ");

			await withGeneratedFixture({
				files,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`${targets} --parallel --max-workers ${String(maxWorkers)}`);

					for (const [dependency, dependent] of edges) {
						const dependencyDone = stdout.indexOf(`Task ${dependency} DONE`);
						const dependentDone = stdout.indexOf(`Task ${dependent} DONE`);

						expect(dependencyDone, `'${dependency}' should finish before '${dependent}' (graph: ${JSON.stringify(edges)})`).toBeLessThan(
							dependentDone
						);
					}
				}
			});
		});
	}
});
