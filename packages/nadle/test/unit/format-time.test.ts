import { it, expect, describe } from "vitest";

import { formatTime } from "../../src/core/utilities/utils.js";

describe("formatTime", () => {
	it("formats short durations with ms", () => {
		expect(formatTime(7)).toBe("7ms");
		expect(formatTime(349)).toBe("349ms");
		expect(formatTime(999)).toBe("999ms");
	});

	it("formats seconds and ms correctly", () => {
		expect(formatTime(1049)).toBe("1s");
		expect(formatTime(1999)).toBe("1s");
		expect(formatTime(3456)).toBe("3s");
		expect(formatTime(12_345)).toBe("12s");
	});

	it("formats minute + seconds with random values", () => {
		expect(formatTime(65_432)).toBe("1m5s");
		expect(formatTime(123_999)).toBe("2m3s");
		expect(formatTime(234_567)).toBe("3m54s");
		expect(formatTime(359_999)).toBe("5m59s");
	});

	it("formats hour + minute with non-round values", () => {
		expect(formatTime(3_660_789)).toBe("1h1m");
		expect(formatTime(7_234_001)).toBe("2h");
		expect(formatTime(14_654_000)).toBe("4h4m");
		expect(formatTime(18_459_234)).toBe("5h7m");
	});

	it("formats exact hour + large durations", () => {
		expect(formatTime(36_000_000)).toBe("10h");
		expect(formatTime(86_400_000)).toBe("24h");
		expect(formatTime(90_000_000)).toBe("25h");
	});
});
