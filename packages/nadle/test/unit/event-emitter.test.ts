import { it, vi, expect, describe } from "vitest";

import { type Listener } from "../../src/core/interfaces/listener.js";
import { EventEmitter } from "../../src/core/models/event-emitter.js";

function createMockListener(overrides: Partial<Listener> = {}): Required<Listener> {
	return {
		onTaskStart: vi.fn(),
		onTaskFinish: vi.fn(),
		onTaskFailed: vi.fn(),
		onTaskCanceled: vi.fn(),
		onTaskUpToDate: vi.fn(),
		onExecutionStart: vi.fn(),
		onTasksScheduled: vi.fn(),
		onExecutionFinish: vi.fn(),
		onExecutionFailed: vi.fn(),
		onTaskRestoreFromCache: vi.fn(),
		onInitialize: vi.fn().mockReturnThis(),
		...overrides
	};
}

const mockTask = { name: "build", id: "root:build" } as any;

describe.concurrent("EventEmitter", () => {
	it("dispatches onExecutionStart to all listeners", async () => {
		const listenerA = createMockListener();
		const listenerB = createMockListener();
		const emitter = new EventEmitter([listenerA, listenerB]);

		await emitter.onExecutionStart();

		expect(listenerA.onExecutionStart).toHaveBeenCalledOnce();
		expect(listenerB.onExecutionStart).toHaveBeenCalledOnce();
	});

	it("dispatches onExecutionFinish to all listeners", async () => {
		const listener = createMockListener();
		const emitter = new EventEmitter([listener]);

		await emitter.onExecutionFinish();

		expect(listener.onExecutionFinish).toHaveBeenCalledOnce();
	});

	it("forwards error argument to onExecutionFailed", async () => {
		const listener = createMockListener();
		const emitter = new EventEmitter([listener]);
		const error = new Error("boom");

		await emitter.onExecutionFailed(error);

		expect(listener.onExecutionFailed).toHaveBeenCalledWith(error);
	});

	it("forwards task and threadId to onTaskStart", async () => {
		const listener = createMockListener();
		const emitter = new EventEmitter([listener]);

		await emitter.onTaskStart(mockTask, 3);

		expect(listener.onTaskStart).toHaveBeenCalledWith(mockTask, 3);
	});

	it("forwards task to onTaskFinish", async () => {
		const listener = createMockListener();
		const emitter = new EventEmitter([listener]);

		await emitter.onTaskFinish(mockTask);

		expect(listener.onTaskFinish).toHaveBeenCalledWith(mockTask);
	});

	it("forwards tasks array to onTasksScheduled", async () => {
		const listener = createMockListener();
		const emitter = new EventEmitter([listener]);
		const tasks = [mockTask];

		await emitter.onTasksScheduled(tasks);

		expect(listener.onTasksScheduled).toHaveBeenCalledWith(tasks);
	});

	it("skips listeners that do not implement the event", async () => {
		const partial: Listener = {};
		const full = createMockListener();
		const emitter = new EventEmitter([partial, full]);

		await emitter.onExecutionStart();

		expect(full.onExecutionStart).toHaveBeenCalledOnce();
	});

	it("onInitialize returns the emitter instance", async () => {
		const emitter = new EventEmitter([createMockListener()]);

		const result = await emitter.onInitialize();

		expect(result).toBe(emitter);
	});
});
