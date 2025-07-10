import { expect } from "vitest";

import { serialize } from "./serialize.js";
import { toSettle } from "./matchers/to-settle.js";
import { toRunInOrder } from "./matchers/to-run-in-order.js";
import { toDoneInOrder } from "./matchers/to-done-in-order.js";
import { toThrowPlainMessage } from "./matchers/to-throw-plain-message.js";

expect.addSnapshotSerializer({ serialize, test: (val) => typeof val === "string" });

expect.extend({ toSettle, toRunInOrder, toDoneInOrder, toThrowPlainMessage });
