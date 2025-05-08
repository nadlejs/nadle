export function createTask(taskName: string, options?: { subTaskCount?: number; subTaskDuration?: number }): [string, () => Promise<void>] {
	const { subTaskCount = 1, subTaskDuration = 1000 } = options || {};

	return [
		taskName,
		async () => {
			for (let i = 0; i < subTaskCount; i++) {
				await new Promise((resolve) => setTimeout(resolve, subTaskDuration));
				console.log(`[${taskName}] Subtask ${i + 1}/${subTaskCount} completed.`);
			}
		}
	];
}
