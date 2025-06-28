export function validateTaskName(name: string): void {
	if (!/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/i.test(name)) {
		throw new Error(
			`Invalid task name "${name}". Task names must contain only letters, numbers, and dashes; start with a letter, and not end with a dash.`
		);
	}
}
