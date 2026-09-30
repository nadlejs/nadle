import { Nadle } from "../nadle.js";
import { BaseHandler } from "./base-handler.js";
import { stringify } from "../utilities/stringify.js";
import { buildFlagManifest } from "../options/flag-manifest.js";
import { TaskConfigurationSchema } from "../interfaces/task-configuration-schema.js";

interface CapabilityTask {
	readonly id: string;
	readonly name: string;
	readonly label: string;
	readonly group?: string;
	readonly workspaceId: string;
	readonly description?: string;
}

export class CapabilitiesHandler extends BaseHandler {
	public readonly name = "capabilities";
	public readonly description = "Emits a machine-readable JSON description of CLI flags, tasks, and task configuration schema.";

	public canHandle(): boolean {
		return this.context.options.capabilities;
	}

	public handle(): void {
		this.context.logger.log(
			stringify({
				version: Nadle.version,
				flags: buildFlagManifest(),
				tasks: this.collectTasks(),
				config: TaskConfigurationSchema
			})
		);
	}

	private collectTasks(): CapabilityTask[] {
		return this.context.taskRegistry.tasks
			.map((task): CapabilityTask => {
				const { group, description } = task.configResolver();

				return {
					id: task.id,
					name: task.name,
					label: task.label,
					workspaceId: task.workspaceId,
					...(group !== undefined ? { group } : {}),
					...(description !== undefined ? { description } : {})
				};
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	}
}
