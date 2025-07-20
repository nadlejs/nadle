import { expect } from "vitest";

import { serialize } from "./serialize.js";

expect.addSnapshotSerializer({ serialize, test: (val) => typeof val === "string" });
