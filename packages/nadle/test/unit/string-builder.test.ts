import { it, expect, describe } from "vitest";

import { StringBuilder } from "../../src/core/utilities/string-builder.js";

describe.concurrent("StringBuilder", () => {
	it("builds empty string when no items added", () => {
		expect(new StringBuilder().build()).toBe("");
	});

	it("joins items with default space separator", () => {
		const result = new StringBuilder().add("hello").add("world").build();

		expect(result).toBe("hello world");
	});

	it("joins items with custom separator", () => {
		const result = new StringBuilder(", ").add("a").add("b").add("c").build();

		expect(result).toBe("a, b, c");
	});

	it("skips false values", () => {
		const result = new StringBuilder().add("keep").add(false).add("this").build();

		expect(result).toBe("keep this");
	});

	it("addIf adds item when condition is true", () => {
		const result = new StringBuilder().add("a").addIf(true, "b").build();

		expect(result).toBe("a b");
	});

	it("addIf skips item when condition is false", () => {
		const result = new StringBuilder().add("a").addIf(false, "b").add("c").build();

		expect(result).toBe("a c");
	});

	it("supports method chaining", () => {
		const builder = new StringBuilder();
		const returned = builder.add("a");

		expect(returned).toBe(builder);
	});

	it("handles single item without trailing separator", () => {
		expect(new StringBuilder(", ").add("only").build()).toBe("only");
	});
});
