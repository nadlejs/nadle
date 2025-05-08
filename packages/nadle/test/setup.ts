import { expect } from "vitest";

import { serializeANSI, serializeDuration, serializeFilePath } from "./snapshot-serializers.js";

expect.addSnapshotSerializer({
	test: (val) => typeof val === "string" && val.includes("\x1b["),
	serialize: (val) => serializeFilePath(serializeDuration(serializeANSI(val)))
});
