import fuzzySort from "fuzzysort";
import React, { useState } from "react";
import { Box, Text, render, useApp, useInput } from "ink";

import { type TaskRegistry } from "../registration/task-registry.js";

interface Task {
	readonly name: string;
	readonly description?: string;
}

interface DisplayTask extends Task {
	readonly selected: boolean;
	readonly pointing: boolean;
	readonly TaskName: () => React.ReactElement;
}

export function renderTaskSelection(taskRegistry: TaskRegistry): Promise<string[]> {
	const tasks = taskRegistry.getAll().map(({ name, configResolver }) => {
		return { name, description: configResolver().description };
	});

	return new Promise((resolve) => {
		render(<TaskSelection onSubmit={resolve} tasks={tasks} />);
	});
}

const VISIBLE_TASKS_LIMIT = 5;
const PRIMARY_COLOR = "cyan";
const SECONDARY_COLOR = "yellow";
const HIGHLIGHT_COLOR = "cyanBright";

function TaskSelection({ tasks, onSubmit }: { tasks: Task[]; onSubmit: (selectedTasks: string[]) => void }) {
	const [cursor, setCursor] = useState(0);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");
	const [isCommandMode, setIsCommandMode] = useState(false);
	const [commandBuffer, setCommandBuffer] = useState("");

	const { exit } = useApp();

	const searchingTasks = useSearching(tasks, searchText, selectedTasks, cursor);

	const exitCommandMode = () => {
		setIsCommandMode(false);
		setCommandBuffer("");
	};

	useInput((input, key) => {
		if (isCommandMode) {
			if (key.return) {
				if (commandBuffer === "q") {
					exit();
					onSubmit([]);
				}

				if (commandBuffer === "l") {
					setSearchText("");

					return exitCommandMode();
				}

				exitCommandMode();

				return;
			}

			if (key.escape) {
				return exitCommandMode();
			}

			setCommandBuffer((prev) => prev + input);

			return;
		}

		if (input === ":") {
			setIsCommandMode(true);
			setCommandBuffer("");

			return;
		}

		if (key.upArrow) {
			setCursor((cursor) => (cursor - 1 + searchingTasks.length) % searchingTasks.length);
		} else if (key.downArrow) {
			setCursor((cursor) => (cursor + 1 + searchingTasks.length) % searchingTasks.length);
		} else if (key.return) {
			exit();
			onSubmit(Array.from(selectedTasks));
		} else if (key.escape) {
			exit();
		} else if (key.backspace || key.delete) {
			setSearchText((f) => f.slice(0, -1));
		} else if (input === " ") {
			const selectingTask = searchingTasks[cursor];

			setSelectedTasks((selectedTasks) =>
				selectedTasks.includes(selectingTask.name) ? selectedTasks.filter((t) => t !== selectingTask.name) : [...selectedTasks, selectingTask.name]
			);
		} else {
			setSearchText((currentSearchText) => currentSearchText + input);
		}
	});

	const renderTask = React.useCallback((task: DisplayTask) => {
		const { name, selected, pointing, TaskName, description } = task;

		return (
			<Text color={pointing ? PRIMARY_COLOR : undefined} key={name}>
				{pointing ? ">" : " "} {`[${selected ? "x" : " "}]`} <TaskName /> {description ? <Text color={SECONDARY_COLOR}>{description}</Text> : ""}
			</Text>
		);
	}, []);

	return (
		<Box flexDirection="column" padding={1} borderStyle="round" borderColor={PRIMARY_COLOR}>
			<Text color={PRIMARY_COLOR}>Select tasks to run (type to search): {searchText}</Text>
			<Box flexDirection="column" marginTop={1}>
				{searchText && searchingTasks.length === 0 ? <Text dimColor>No matched tasks</Text> : searchingTasks.map(renderTask)}
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
}

function useSearching(tasks: Task[], searchText: string, selectedTasks: string[], cursor: number) {
	return React.useMemo(() => {
		if (!searchText) {
			const visibleTasks = tasks.slice(0, VISIBLE_TASKS_LIMIT);
			const maxLength = Math.max(...visibleTasks.map((task) => task.name.length));

			return visibleTasks.map<DisplayTask>((task) => {
				return {
					...task,
					pointing: cursor === tasks.indexOf(task),
					selected: selectedTasks.includes(task.name),
					TaskName: (): React.ReactElement => <>{task.name.padEnd(maxLength + 1, " ")}</>
				};
			});
		}

		const filteredTasks: Fuzzysort.KeyResults<Task> = fuzzySort.go<Task>(searchText, tasks, { key: "name" });

		const maxLength = Math.max(...filteredTasks.map((task) => task.obj.name.length));

		return filteredTasks.slice(0, VISIBLE_TASKS_LIMIT).map<DisplayTask>((task) => {
			return {
				...task.obj,
				selected: selectedTasks.includes(task.obj.name),
				pointing: cursor === filteredTasks.indexOf(task),
				TaskName: () => (
					<>
						{task
							.highlight((char, charIndex) => (
								<Text key={charIndex} color={HIGHLIGHT_COLOR}>
									{char}
								</Text>
							))
							.map((part, i) => (typeof part === "string" ? <Text key={i}>{part}</Text> : <React.Fragment key={i}>{part}</React.Fragment>))}
						{" ".repeat(Math.max(maxLength - task.obj.name.length + 2, 1))}
					</>
				)
			};
		});
	}, [cursor, searchText, selectedTasks, tasks]);
}
