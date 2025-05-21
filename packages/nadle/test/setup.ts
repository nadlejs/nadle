import { expect } from "vitest";

import { serializeANSI, serializeVersion, serializeDuration, serializeFilePath } from "./snapshot-serializers.js";

expect.addSnapshotSerializer({
	test: (val) => typeof val === "string" && val.includes("\x1b["),
	serialize: (val) => serializeVersion(serializeFilePath(serializeDuration(serializeANSI(val))))
});
