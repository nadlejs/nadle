import type { RimrafAsyncOptions } from "rimraf";
import { it, describe, expectTypeOf } from "vitest";
import {
	CopyTask,
	ExecTask,
	PnpmTask,
	type Task,
	DeleteTask,
	type MaybeArray,
	type CopyTaskOptions,
	type ExecTaskOptions,
	type PnpmTaskOptions,
	type DeleteTaskOptions
} from "nadle";

describe.concurrent("ExecTask", () => {
	it("satisfies Task<ExecTaskOptions>", () => {
		expectTypeOf(ExecTask).toEqualTypeOf<Task<ExecTaskOptions>>();
	});

	it("ExecTaskOptions has command and args", () => {
		expectTypeOf<ExecTaskOptions["command"]>().toEqualTypeOf<string>();
		expectTypeOf<ExecTaskOptions["args"]>().toEqualTypeOf<MaybeArray<string>>();
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
