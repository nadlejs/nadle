import { expect } from "vite-plus/test";

import { serialize } from "./serialize.js";

expect.addSnapshotSerializer({ serialize, test: (val) => typeof val === "string" });
