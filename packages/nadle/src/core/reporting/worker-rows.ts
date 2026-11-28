/**
 * The footer's worker rows: each running task in its worker's slot, `undefined` for an idle one.
 * Idle rows beyond the number of pending tasks are dropped, since no task is left to fill them.
 */
export function workerRows(running: readonly { label: string; threadId: number }[], pending: number): (string | undefined)[] {
	const slots: (string | undefined)[] = [];

	for (const { label, threadId } of running) {
		slots[threadId - 1] = label;
	}

	let idleKept = 0;

	return Array.from(slots, (label) => label).filter((label) => label !== undefined || idleKept++ < pending);
}
