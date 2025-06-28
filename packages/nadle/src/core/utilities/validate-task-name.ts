export function validateTaskName(name: string): void {
	if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
		throw new Error(`Invalid task name "${name}". Only alphanumeric characters are allowed, and it must start with a letter.`);
	}
}
