#!/usr/bin/env node
process.argv.push("--stdio");
await import("./lib/server.js");
