import { formatTime } from "../utilities/utils.js";

interface DoneTask {
	readonly name: string;
	readonly duration: number;
}

interface Row {
	readonly name: string;
	readonly duration: string;
	readonly percentage: string;
}

namespace ProfilingSummary {
	export interface Props {
		readonly tasks: DoneTask[];
		readonly totalDuration: number;
	}
}

export function renderProfilingSummary({ tasks, totalDuration }: ProfilingSummary.Props) {
	const rows: Row[] = [{ name: "Task", duration: "Duration", percentage: "Percentage" }];

	for (const task of tasks.sort((task1, task2) => task2.duration - task1.duration).slice(0, 5)) {
		const duration = formatTime(task.duration);
		const percentage = ((task.duration / totalDuration) * 100).toFixed(1) + "%";

		rows.push({
			duration,
			percentage,
			name: task.name
		});
	}

	const widths: Record<keyof Row, number> = { name: 0, duration: 0, percentage: 0 };

	for (const row of rows) {
		widths.name = Math.max(widths.name, row.name.length);
		widths.duration = Math.max(widths.duration, row.duration.length);
		widths.percentage = Math.max(widths.percentage, row.percentage.length);
	}

	const header = rows[0];
	const headerLine = `| ${header.name.padEnd(widths.name)} | ${header.duration.padEnd(widths.duration)} | ${header.percentage.padEnd(widths.percentage)} |`;
	const separator = `| ${"-".repeat(widths.name)} | ${"-".repeat(widths.duration)} | ${"-".repeat(widths.percentage)} |`;
	const bodyLines = rows
		.slice(1)
		.map((row) => `| ${row.name.padEnd(widths.name)} | ${row.duration.padStart(widths.duration)} | ${row.percentage.padStart(widths.percentage)} |`);

	return `${headerLine}\n${separator}\n${bodyLines.join("\n")}`;
}
