import c from "tinyrainbow";

import { formatTime } from "../utilities/utils.js";

interface Task {
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
		readonly tasks: Task[];
		readonly totalDuration: number;
	}
}

const TASK_LIMIT = 5;

export function renderProfilingSummary({ tasks, totalDuration }: ProfilingSummary.Props) {
	if (tasks.length === 0) {
		return "";
	}

	const headerRow = { name: "Task", duration: "Duration", percentage: "Percentage" };
	const bodyRows: Row[] = [];

	for (const task of tasks.sort((task1, task2) => task2.duration - task1.duration).slice(0, TASK_LIMIT)) {
		bodyRows.push({ name: task.name, duration: formatTime(task.duration), percentage: ((task.duration / totalDuration) * 100).toFixed(1) + "%" });
	}

	const columnWidths: Record<keyof Row, number> = { name: 0, duration: 0, percentage: 0 };

	for (const row of [headerRow, ...bodyRows]) {
		columnWidths.name = Math.max(columnWidths.name, row.name.length);
		columnWidths.duration = Math.max(columnWidths.duration, row.duration.length);
		columnWidths.percentage = Math.max(columnWidths.percentage, row.percentage.length);
	}

	const widths = Object.values(columnWidths).map((width) => width + 2);

	return [
		"",
		c.bold(c.green("Profiling Summary")),
		renderBorder("top", widths),
		renderRow([headerRow.name, headerRow.duration, headerRow.percentage], widths, ["left", "right", "right"]),
		renderBorder("join", widths),
		...bodyRows.map((row) => renderRow([row.name, row.duration, row.percentage], widths, ["left", "right", "right"])),
		renderBorder("bottom", widths)
	].join("\n");
}

type Alignment = "left" | "right";
const toPad = (alignment: Alignment) => (alignment === "left" ? "padEnd" : "padStart");
const renderRow = (cells: string[], lengths: number[], alignments: Alignment[]) =>
	CHARS.bodyLeft + cells.map((cell, index) => ` ${cell[toPad(alignments[index])](lengths[index] - 2, " ")} `).join(CHARS.bodyJoin) + CHARS.bodyRight;

const renderBorder = (type: "top" | "bottom" | "join", lengths: number[]) =>
	CHARS[`${type}Left`] + lengths.map((length) => CHARS[`${type}Body`].repeat(length)).join(CHARS[`${type}Join`]) + CHARS[`${type}Right`];

const CHARS = {
	topBody: "─",
	topJoin: "┬",
	topLeft: "┌",
	topRight: "┐",

	bottomBody: "─",
	bottomJoin: "┴",
	bottomLeft: "└",
	bottomRight: "┘",

	bodyLeft: "│",
	bodyJoin: "│",
	bodyRight: "│",
	headerJoin: "┬",

	joinBody: "─",
	joinLeft: "├",
	joinJoin: "┼",
	joinRight: "┤"
} as const;
