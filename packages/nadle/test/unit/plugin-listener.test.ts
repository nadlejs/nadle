import { it, vi, expect, describe } from "vitest";

import { PluginListener } from "../../src/core/plugins/plugin-listener.js";
import { PluginRegistry } from "../../src/core/plugins/plugin-registry.js";

const fakeContext = (warn = vi.fn()) =>
	({ taskRegistry: { tasks: [] }, logger: { warn, log: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } }) as never;

describe("PluginListener", () => {
	it("dispatches beforeAll in pre then normal then post order", async () => {
		const calls: string[] = [];
		const registry = new PluginRegistry();
		registry.apply({ name: "post", enforce: "post", hooks: { beforeAll: () => void calls.push("post") } });
		registry.apply({ name: "normal", hooks: { beforeAll: () => void calls.push("normal") } });
		registry.apply({ name: "pre", enforce: "pre", hooks: { beforeAll: () => void calls.push("pre") } });

		await new PluginListener(fakeContext(), registry).onExecutionStart();

		expect(calls).toEqual(["pre", "normal", "post"]);
	});

	it("lets a throwing beforeAll propagate (aborts the run)", async () => {
		const registry = new PluginRegistry();
		registry.apply({
			name: "boom",
			hooks: {
				beforeAll: () => {
					throw new Error("nope");
				}
			}
		});

		await expect(new PluginListener(fakeContext(), registry).onExecutionStart()).rejects.toThrow("nope");
	});

	it("catches a throwing afterAll and downgrades to a warning", async () => {
		const warn = vi.fn();
		const registry = new PluginRegistry();
		registry.apply({
			name: "boom",
			hooks: {
				afterAll: () => {
					throw new Error("teardown");
				}
			}
		});

		await expect(new PluginListener(fakeContext(warn), registry).onExecutionFinish()).resolves.toBeUndefined();
		expect(warn).toHaveBeenCalled();
	});

	it("maps onTaskStart to beforeTask and the terminal events to afterTask with a result", async () => {
		const results: string[] = [];
		const registry = new PluginRegistry();
		registry.apply({
			name: "tap",
			hooks: {
				beforeTask: (ctx) => void results.push(`before:${ctx.task.id}`),
				afterTask: (ctx) => void results.push(`after:${ctx.task.id}:${ctx.result}`)
			}
		});
		const listener = new PluginListener(fakeContext(), registry);
		const task = { id: "build", label: "build" } as never;

		await listener.onTaskStart(task, 1);
		await listener.onTaskFinish(task);
		await listener.onTaskUpToDate(task);
		await listener.onTaskRestoreFromCache(task);
		await listener.onTaskFailed(task);
		await listener.onTaskCanceled(task);

		expect(results).toEqual([
			"before:build",
			"after:build:done",
			"after:build:up-to-date",
			"after:build:from-cache",
			"after:build:failed",
			"after:build:canceled"
		]);
	});

	it("catches a throwing beforeTask and downgrades to a warning (does not abort)", async () => {
		const warn = vi.fn();
		const registry = new PluginRegistry();
		registry.apply({
			name: "boom",
			hooks: {
				beforeTask: () => {
					throw new Error("task hook");
				}
			}
		});

		await expect(new PluginListener(fakeContext(warn), registry).onTaskStart({ id: "x", label: "x" } as never, 1)).resolves.toBeUndefined();
		expect(warn).toHaveBeenCalled();
	});

	it("passes outcome and error to afterAll on the failure path", async () => {
		let received: { error?: unknown; outcome?: string } = {};
		const registry = new PluginRegistry();
		registry.apply({ name: "tap", hooks: { afterAll: (ctx) => void (received = { error: ctx.error, outcome: ctx.outcome }) } });

		await new PluginListener(fakeContext(), registry).onExecutionFailed(new Error("boom"));

		expect(received.outcome).toBe("failed");
		expect((received.error as Error).message).toBe("boom");
	});
});
