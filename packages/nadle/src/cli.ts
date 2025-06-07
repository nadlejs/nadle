#!/usr/bin/env node

import { runCli } from "./run-cli.js";
import { setupCli } from "./setup-cli.js";

runCli(setupCli().parseSync());
