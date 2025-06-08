"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_url_1 = require("node:url");
const nadle_1 = require("nadle");
nadle_1.tasks.register("hello", () => {
    console.log(`Hello from ${(0, node_url_1.fileURLToPath)(import.meta.url)}!`);
});
//# sourceMappingURL=nadle.config.js.map