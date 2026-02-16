import { it, describe, expectTypeOf } from "vitest";
import { configure, type AliasOption, type NadleBaseOptions, type NadleFileOptions } from "nadle";

describe.concurrent("configure", () => {
	it("accepts NadleFileOptions and returns void", () => {
		expectTypeOf(configure).parameter(0).toEqualTypeOf<NadleFileOptions>();
		expectTypeOf(configure).returns.toEqualTypeOf<void>();
	});

	it("accepts all NadleBaseOptions fields", () => {
		expectTypeOf<NadleBaseOptions>().toExtend<{
			readonly cache?: boolean;
			readonly footer?: boolean;
			readonly cacheDir?: string;
			readonly parallel?: boolean;
			readonly maxWorkers?: number | string;
			readonly minWorkers?: number | string;
			readonly logLevel?: "error" | "log" | "info" | "debug";
		}>();
	});

	it("NadleFileOptions extends Partial<NadleBaseOptions> with optional alias", () => {
		expectTypeOf<NadleFileOptions>().toExtend<Partial<NadleBaseOptions>>();
		expectTypeOf<NadleFileOptions["alias"]>().toEqualTypeOf<AliasOption | undefined>();
	});

	it("AliasOption accepts record and function forms", () => {
		expectTypeOf<Record<string, string>>().toExtend<AliasOption>();
		expectTypeOf<(workspacePath: string) => string | undefined>().toExtend<AliasOption>();
	});
});
