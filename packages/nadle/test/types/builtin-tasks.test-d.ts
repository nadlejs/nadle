import type { RimrafAsyncOptions } from "rimraf";
import { it, describe, expectTypeOf } from "vitest";
import {
	NpmTask,
	NpxTask,
	NodeTask,
	CopyTask,
	ExecTask,
	PnpmTask,
	PnpxTask,
	type Task,
	DeleteTask,
	type MaybeArray,
	type NpmTaskOptions,
	type NpxTaskOptions,
	type NodeTaskOptions,
	type CopyTaskOptions,
	type ExecTaskOptions,
	type PnpmTaskOptions,
	type PnpxTaskOptions,
	type DeleteTaskOptions
} from "nadle";

describe.concurrent("ExecTask", () => {
	it("satisfies Task<ExecTaskOptions>", () => {
		expectTypeOf(ExecTask).toEqualTypeOf<Task<ExecTaskOptions>>();
	});

	it("ExecTaskOptions has command and optional args", () => {
		expectTypeOf<ExecTaskOptions["command"]>().toEqualTypeOf<string>();
		expectTypeOf<ExecTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string> | undefined>();
	});
});

describe.concurrent("NodeTask", () => {
	it("satisfies Task<NodeTaskOptions>", () => {
		expectTypeOf(NodeTask).toEqualTypeOf<Task<NodeTaskOptions>>();
	});

	it("NodeTaskOptions has script and optional args", () => {
		expectTypeOf<NodeTaskOptions["script"]>().toEqualTypeOf<string>();
		expectTypeOf<NodeTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string> | undefined>();
	});
});

describe.concurrent("NpmTask", () => {
	it("satisfies Task<NpmTaskOptions>", () => {
		expectTypeOf(NpmTask).toEqualTypeOf<Task<NpmTaskOptions>>();
	});

	it("NpmTaskOptions has args", () => {
		expectTypeOf<NpmTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string>>();
	});
});

describe.concurrent("PnpmTask", () => {
	it("satisfies Task<PnpmTaskOptions>", () => {
		expectTypeOf(PnpmTask).toEqualTypeOf<Task<PnpmTaskOptions>>();
	});

	it("PnpmTaskOptions has args", () => {
		expectTypeOf<PnpmTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string>>();
	});
});

describe.concurrent("PnpxTask", () => {
	it("satisfies Task<PnpxTaskOptions>", () => {
		expectTypeOf(PnpxTask).toEqualTypeOf<Task<PnpxTaskOptions>>();
	});

	it("PnpxTaskOptions has command and optional args", () => {
		expectTypeOf<PnpxTaskOptions["command"]>().toEqualTypeOf<string>();
		expectTypeOf<PnpxTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string> | undefined>();
	});
});

describe.concurrent("NpxTask", () => {
	it("satisfies Task<NpxTaskOptions>", () => {
		expectTypeOf(NpxTask).toEqualTypeOf<Task<NpxTaskOptions>>();
	});

	it("NpxTaskOptions has command and optional args", () => {
		expectTypeOf<NpxTaskOptions["command"]>().toEqualTypeOf<string>();
		expectTypeOf<NpxTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string> | undefined>();
	});
});

describe.concurrent("CopyTask", () => {
	it("satisfies Task<CopyTaskOptions>", () => {
		expectTypeOf(CopyTask).toEqualTypeOf<Task<CopyTaskOptions>>();
	});

	it("CopyTaskOptions has from, to, include, exclude", () => {
		expectTypeOf<CopyTaskOptions["from"]>().toEqualTypeOf<string>();
		expectTypeOf<CopyTaskOptions["to"]>().toEqualTypeOf<string>();
		expectTypeOf<CopyTaskOptions["include"]>().toEqualTypeOf<MaybeArray<string> | undefined>();
		expectTypeOf<CopyTaskOptions["exclude"]>().toEqualTypeOf<MaybeArray<string> | undefined>();
	});
});

describe.concurrent("DeleteTask", () => {
	it("satisfies Task<DeleteTaskOptions>", () => {
		expectTypeOf(DeleteTask).toEqualTypeOf<Task<DeleteTaskOptions>>();
	});

	it("DeleteTaskOptions has paths", () => {
		expectTypeOf<DeleteTaskOptions["paths"]>().toEqualTypeOf<MaybeArray<string>>();
	});

	it("DeleteTaskOptions extends RimrafAsyncOptions", () => {
		expectTypeOf<DeleteTaskOptions>().toExtend<RimrafAsyncOptions>();
	});
});
