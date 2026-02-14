import { bench, describe } from "vitest";

/**
 * Standalone topological sort matching the DAG algorithm used by TaskScheduler.
 * Extracted to avoid coupling to the full Nadle runtime.
 */
function buildAndSort(taskCount: number): string[] {
	const dependencyGraph = new Map<string, Set<string>>();
	const dependentsGraph = new Map<string, Set<string>>();
	const indegree = new Map<string, number>();

	// Build a linear chain: task-0 → task-1 → ... → task-(n-1)
	for (let i = 0; i < taskCount; i++) {
		const taskId = `task-${i}`;
		dependencyGraph.set(taskId, new Set());
		indegree.set(taskId, 0);

		if (!dependentsGraph.has(taskId)) {
			dependentsGraph.set(taskId, new Set());
		}

		if (i > 0) {
			const dep = `task-${i - 1}`;
			dependencyGraph.get(taskId)!.add(dep);
			indegree.set(taskId, 1);

			if (!dependentsGraph.has(dep)) {
				dependentsGraph.set(dep, new Set());
			}

			dependentsGraph.get(dep)!.add(taskId);
		}
	}

	// Kahn's algorithm (mirrors TaskScheduler.getReadyTasks / getExecutionPlan)
	const result: string[] = [];
	const ready: string[] = [];

	for (const [taskId, deg] of indegree) {
		if (deg === 0) {
			ready.push(taskId);
		}
	}

	while (ready.length > 0) {
		const taskId = ready.shift()!;
		result.push(taskId);

		for (const dependent of dependentsGraph.get(taskId) ?? []) {
			const newDeg = indegree.get(dependent)! - 1;
			indegree.set(dependent, newDeg);

			if (newDeg === 0) {
				ready.push(dependent);
			}
		}
	}

	return result;
}

describe("TaskScheduler: topological sort", () => {
	bench("10 tasks (linear chain)", () => {
		buildAndSort(10);
	});

	bench("100 tasks (linear chain)", () => {
		buildAndSort(100);
	});

	bench("1000 tasks (linear chain)", () => {
		buildAndSort(1000);
	});
});

/**
 * Fan-out DAG: single root → N leaf tasks.
 */
function buildAndSortFanOut(leafCount: number): string[] {
	const dependencyGraph = new Map<string, Set<string>>();
	const dependentsGraph = new Map<string, Set<string>>();
	const indegree = new Map<string, number>();

	const rootId = "root";
	dependencyGraph.set(rootId, new Set());
	dependentsGraph.set(rootId, new Set());
	indegree.set(rootId, 0);

	for (let i = 0; i < leafCount; i++) {
		const leafId = `leaf-${i}`;
		dependencyGraph.set(leafId, new Set([rootId]));
		dependentsGraph.get(rootId)!.add(leafId);
		indegree.set(leafId, 1);

		if (!dependentsGraph.has(leafId)) {
			dependentsGraph.set(leafId, new Set());
		}
	}

	const result: string[] = [];
	const ready: string[] = [];

	for (const [taskId, deg] of indegree) {
		if (deg === 0) {
			ready.push(taskId);
		}
	}

	while (ready.length > 0) {
		const taskId = ready.shift()!;
		result.push(taskId);

		for (const dependent of dependentsGraph.get(taskId) ?? []) {
			const newDeg = indegree.get(dependent)! - 1;
			indegree.set(dependent, newDeg);

			if (newDeg === 0) {
				ready.push(dependent);
			}
		}
	}

	return result;
}

describe("TaskScheduler: fan-out DAG", () => {
	bench("1 root → 10 leaves", () => {
		buildAndSortFanOut(10);
	});

	bench("1 root → 100 leaves", () => {
		buildAndSortFanOut(100);
	});

	bench("1 root → 1000 leaves", () => {
		buildAndSortFanOut(1000);
	});
});
