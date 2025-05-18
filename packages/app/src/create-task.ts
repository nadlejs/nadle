import c from "tinyrainbow";
const colorMap = [c.green, c.blue, c.cyan, c.yellow];

function hash(taskName: string) {
	let sum = 0;

	for (let i = 0; i < taskName.length; i++) {
		sum += taskName.charCodeAt(i);
	}

	return sum % colorMap.length;
}

export function createTask(taskName: string, options?: { subTaskCount?: number; subTaskDuration?: number }): [string, () => Promise<void>] {
	const { subTaskCount = 1, subTaskDuration = 1000 } = options || {};

	return [
		taskName,
		async () => {
			for (let i = 0; i < subTaskCount; i++) {
				await new Promise((resolve) => setTimeout(resolve, subTaskDuration));

				console.log(`[${colorMap[hash(taskName)](taskName)}] Subtask ${i + 1}/${subTaskCount} completed.`);
			}
		}
	];
}
