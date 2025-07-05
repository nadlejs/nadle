import React, { useState } from "react";
import { Box, Text, render, useApp, useInput } from "ink";

import { VisibleTask } from "./visible-task.js";
import { useSearching } from "./use-searching.js";
import { type Context, inputHandlers } from "./input-handlers.js";
import { type TaskRegistry } from "../registration/task-registry.js";

export interface Task {
	readonly label: string;
	readonly description?: string;
}

export function renderTaskSelection(taskRegistry: TaskRegistry): Promise<string[]> {
	const tasks = taskRegistry.getAll().map(({ label, configResolver }) => {
		return { label, description: configResolver().description };
	});

	return new Promise((resolve) => {
		render(<TasksSelection onSubmit={resolve} tasks={tasks} />);
	});
}

export const PRIMARY_COLOR = "cyan";
export const SECONDARY_COLOR = "yellow";
export const HIGHLIGHT_COLOR = "cyanBright";

namespace TasksSelection {
	export interface Props {
		readonly tasks: Task[];
		readonly onSubmit: (selectedTasks: string[]) => void;
	}
}

const TasksSelection: React.FC<TasksSelection.Props> = ({ tasks, onSubmit }) => {
	const [cursor, setCursor] = useState(0);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");
	const [isCommandMode, setIsCommandMode] = useState(false);
	const [commandBuffer, setCommandBuffer] = useState("");

	const searchingTasks = useSearching(tasks, searchText, selectedTasks, cursor);

	const { exit } = useApp();

	const context: Context = React.useMemo(() => {
		return {
			exit,
			cursor,
			onSubmit,
			setCursor,
			isCommandMode,
			commandBuffer,
			setSearchText,
			selectedTasks,
			searchingTasks,
			setSelectedTasks,
			setCommandBuffer,
			setIsCommandMode
		};
	}, [commandBuffer, cursor, exit, isCommandMode, onSubmit, searchingTasks, selectedTasks]);

	useInput((input, key) => {
		const handleParams = { key, input, context };

		for (const { handle, canHandle } of inputHandlers) {
			if (canHandle(handleParams)) {
				handle(handleParams);

				return;
			}
		}
	});

	return (
		<Box flexDirection="column" padding={1} borderStyle="round" borderColor={PRIMARY_COLOR}>
			<Text color={PRIMARY_COLOR}>Select tasks to run (type to search): {searchText}</Text>
			<Box flexDirection="column" marginTop={1}>
				{searchText && searchingTasks.length === 0 ? (
					<Text dimColor>No matched tasks</Text>
				) : (
					searchingTasks.map((task) => <VisibleTask key={task.label} task={task} />)
				)}
			</Box>

			<Box marginTop={1}>
				<Text color={PRIMARY_COLOR}>Selected tasks: {selectedTasks.join(", ")}</Text>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>[↑↓]: Navigate [Space]: Toggle [Enter]: Run [:q]: Quit [:l]: Clear</Text>
			</Box>
			{isCommandMode && (
				<Box marginTop={1}>
					<Text color={PRIMARY_COLOR}>Command: :{commandBuffer}</Text>
				</Box>
			)}
		</Box>
	);
};
