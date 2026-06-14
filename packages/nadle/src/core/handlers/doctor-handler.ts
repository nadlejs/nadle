import Path from "node:path";
import Fs from "node:fs/promises";

import c from "tinyrainbow";
import { getWorkspaceById } from "@nadle/project-resolver";

import { BaseHandler } from "./base-handler.js";
import { NadleError } from "../utilities/nadle-error.js";
import { MaybeArray } from "../utilities/maybe-array.js";
import { Declaration } from "../models/cache/declaration.js";
import { type TaskConfiguration } from "../interfaces/task-configuration.js";

type Status = "ok" | "warning" | "error";

interface Finding {
	status: Status;
	message: string;
}

export class DoctorHandler extends BaseHandler {
	public readonly name = "doctor";
	public readonly description = "Diagnoses project, configuration, and cache health without executing tasks.";

	public canHandle(): boolean {
		return this.context.options.doctor;
	}

	public async handle(): Promise<void> {
		const findings: Finding[] = [
			this.checkProject(),
			await this.checkCacheDir(),
			...this.checkPartialCacheability(),
			...(await this.checkStaleOutputs())
		];

		for (const finding of findings) {
			this.context.logger.log(`${DoctorHandler.icon(finding.status)} ${finding.message}`);
		}

		const errors = findings.filter((finding) => finding.status === "error").length;
		const warnings = findings.filter((finding) => finding.status === "warning").length;

		this.context.logger.log("");
		this.context.logger.log(`Doctor: ${findings.length} checks, ${warnings} warning(s), ${errors} error(s).`);

		if (errors > 0) {
			throw new NadleError(`Doctor found ${errors} error(s).`, 1);
		}
	}

	private static icon(status: Status): string {
		switch (status) {
			case "ok":
				return c.green("✓");
			case "warning":
				return c.yellow("!");
			case "error":
				return c.red("✗");
		}
	}

	private checkProject(): Finding {
		const { project } = this.context.options;

		return {
			status: "ok",
			message: `Project resolved: ${project.packageManager} package manager, ${project.workspaces.length} workspace(s).`
		};
	}

	private async checkCacheDir(): Promise<Finding> {
		const { cacheDir } = this.context.options;

		try {
			await Fs.access(cacheDir);
		} catch {
			// A missing cache directory is normal (nothing cached yet).
			return { status: "ok", message: `Cache directory not yet created at ${cacheDir}.` };
		}

		try {
			await Fs.access(cacheDir, Fs.constants.W_OK);

			return { status: "ok", message: `Cache directory is writable at ${cacheDir}.` };
		} catch {
			return { status: "warning", message: `Cache directory is not writable at ${cacheDir}.` };
		}
	}

	private checkPartialCacheability(): Finding[] {
		const findings: Finding[] = [];

		for (const task of this.context.taskRegistry.tasks) {
			const config = task.configResolver();
			const hasInputs = config.inputs !== undefined;
			const hasOutputs = config.outputs !== undefined;

			if (hasInputs !== hasOutputs) {
				const missing = hasInputs ? "outputs" : "inputs";
				findings.push({
					status: "warning",
					message: `Task ${task.label} declares ${hasInputs ? "inputs" : "outputs"} but no ${missing}, so it is never cached.`
				});
			}
		}

		return findings;
	}

	private async checkStaleOutputs(): Promise<Finding[]> {
		const findings: Finding[] = [];

		for (const task of this.context.taskRegistry.tasks) {
			const config = task.configResolver();

			if (config.inputs === undefined || config.outputs === undefined) {
				continue;
			}

			const workingDir = this.resolveWorkingDir(task.workspaceId, config);
			const resolved = await Promise.all(MaybeArray.toArray(config.outputs).map((declaration) => Declaration.resolve(declaration, workingDir)));

			if (resolved.flat().length === 0) {
				findings.push({
					status: "warning",
					message: `Task ${task.label} has no existing declared outputs on disk; its cache cannot be trusted until it runs.`
				});
			}
		}

		return findings;
	}

	private resolveWorkingDir(workspaceId: string, config: TaskConfiguration): string {
		const workspace = getWorkspaceById(this.context.options.project, workspaceId);

		return Path.resolve(workspace.absolutePath, config.workingDir ?? "");
	}
}
