#!/usr/bin/env node
import { runCli, setupCli } from "./run.js";

runCli(setupCli().parseSync());
