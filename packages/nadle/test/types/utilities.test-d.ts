import { it, describe, expectTypeOf } from "vitest";
import { MaybeArray, NadleError, type Callback, type Resolver, type Awaitable, type SupportLogLevel } from "nadle";

describe.concurrent("Awaitable", () => {
	it("is T | PromiseLike<T>", () => {
		expectTypeOf<Awaitable<string>>().toEqualTypeOf<string | PromiseLike<string>>();
	});
});

describe.concurrent("Callback", () => {
	it("is (params: P) => T", () => {
		expectTypeOf<Callback<string, number>>().toEqualTypeOf<(params: number) => string>();
	});

	it("defaults to unknown return and void params", () => {
		expectTypeOf<Callback>().toEqualTypeOf<(params: void) => unknown>();
	});
});

describe.concurrent("Resolver", () => {
	it("is T | Callback<T>", () => {
		expectTypeOf<Resolver<string>>().toEqualTypeOf<string | Callback<string>>();
	});

	it("defaults to unknown", () => {
		expectTypeOf<Resolver>().toEqualTypeOf<unknown | Callback<unknown>>();
	});
});

describe.concurrent("MaybeArray", () => {
	it("is T | T[]", () => {
		expectTypeOf<MaybeArray<string>>().toEqualTypeOf<string | string[]>();
	});

	it("toArray returns T[]", () => {
		expectTypeOf(MaybeArray.toArray).parameter(0).toEqualTypeOf<MaybeArray<unknown>>();
		expectTypeOf(MaybeArray.toArray<string>).returns.toEqualTypeOf<string[]>();
	});
});

describe.concurrent("SupportLogLevel", () => {
	it("is union of log level strings", () => {
		expectTypeOf<SupportLogLevel>().toEqualTypeOf<"error" | "log" | "info" | "debug">();
	});
});

describe.concurrent("NadleError", () => {
	it("extends Error", () => {
		expectTypeOf<NadleError>().toExtend<Error>();
	});

	it("has errorCode property", () => {
		expectTypeOf<NadleError["errorCode"]>().toEqualTypeOf<number>();
	});

	it("is constructable with message and optional errorCode", () => {
		expectTypeOf(NadleError).constructorParameters.toEqualTypeOf<[string, number?]>();
	});
});
