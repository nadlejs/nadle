import { it, expect, describe } from "vitest";

import { createAliasResolver } from "../src/index.js";

describe("createAliasResolver", () => {
	it("returns undefined for any path when alias option is undefined", () => {
		const resolve = createAliasResolver(undefined);
		expect(resolve("packages/foo")).toBeUndefined();
		expect(resolve("packages/bar")).toBeUndefined();
	});

	it("resolves from object map", () => {
		const resolve = createAliasResolver({ "packages/foo": "foo", "packages/bar": "bar" });
		expect(resolve("packages/foo")).toBe("foo");
		expect(resolve("packages/bar")).toBe("bar");
		expect(resolve("packages/unknown")).toBeUndefined();
	});

	it("resolves from function", () => {
		const resolve = createAliasResolver((path) => (path === "packages/foo" ? "foo" : undefined));
		expect(resolve("packages/foo")).toBe("foo");
		expect(resolve("packages/bar")).toBeUndefined();
	});
});
