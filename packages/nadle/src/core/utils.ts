export function capitalize(str: string): string {
	if (str.length === 0) {
		return str;
	}

	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTime(time: number): string {
	if (time > 1000) {
		return `${(time / 1000).toFixed(2)}s`;
	}

	return `${Math.round(time)}ms`;
}

export function formatTimeString(date: Date): string {
	return date.toTimeString().split(" ")[0];
}
