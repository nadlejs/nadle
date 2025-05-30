import { type Context } from "nadle";

export function createTask(
	taskName: string,
	options?: { subTaskCount?: number; subTaskDuration?: number }
): [string, (params: { context: Context }) => Promise<void>] {
	const { subTaskCount = 1, subTaskDuration = 1000 } = options || {};

	return [
		taskName,
		async ({ context }) => {
			for (let i = 0; i < subTaskCount; i++) {
				await new Promise((resolve) => setTimeout(resolve, subTaskDuration));
				context.nadle.logger.info(`[${taskName}] Subtask ${i + 1}/${subTaskCount} completed.`);
			}
		}
	];
}
