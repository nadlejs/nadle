#!/usr/bin/env node
import { runCli, setupCli } from "./lib/cli.js";

const argv = await setupCli().parseAsync();
await runCli(argv);
