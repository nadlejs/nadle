import React, { useState } from "react";
import { Box, Text, render, useApp, useInput } from "ink";

import { type TaskRegistry } from "./registration/task-registry.js";

interface Task {
	readonly name: string;
	readonly description?: string;
}

export function renderTaskSelection(taskRegistry: TaskRegistry): Promise<string[]> {
	const tasks = taskRegistry.getAll().map(({ name, configResolver }) => {
		return { name, description: configResolver().description };
	});

	return new Promise((resolve) => {
		render(<TaskSelection onSubmit={resolve} tasks={tasks} />);
	});
}

function TaskSelection({ tasks, onSubmit }: { tasks: Task[]; onSubmit: (selectedTasks: string[]) => void }) {
	const [cursor, setCursor] = useState(0);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");
	const [isCommandMode, setIsCommandMode] = useState(false);
	const [commandBuffer, setCommandBuffer] = useState("");

	const { exit } = useApp();

	const visibleTasks = tasks.filter((t) => t.name.toLowerCase().includes(searchText.toLowerCase())).slice(0, 5);

	const maxLength = Math.max(...visibleTasks.map((t) => t.name.length));

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
			setCursor((c) => Math.max(c - 1, 0));
		} else if (key.downArrow) {
			setCursor((c) => Math.min(c + 1, visibleTasks.length - 1));
		} else if (key.return) {
			exit();
			onSubmit(Array.from(selectedTasks));
		} else if (key.escape) {
			exit();
		} else if (key.backspace || key.delete) {
			setSearchText((f) => f.slice(0, -1));
		} else if (input === " ") {
			const selectingTask = visibleTasks[cursor];

			setSelectedTasks((currentSelectedTasks) =>
				currentSelectedTasks.includes(selectingTask.name)
					? currentSelectedTasks.filter((t) => t !== selectingTask.name)
					: [...currentSelectedTasks, selectingTask.name]
			);
		} else {
			setSearchText((currentSearchText) => currentSearchText + input);
		}
	});

	return (
		<Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
			<Text color="cyanBright">Select tasks to run (type to search): {searchText}</Text>
			<Box flexDirection="column" marginTop={1}>
				{visibleTasks.map((task, i) => (
					<Text key={task.name} color={i === cursor ? "green" : undefined}>
						{`${i === cursor ? ">" : " "} [${selectedTasks.includes(task.name) ? "x" : " "}] ${task.name.padEnd(maxLength + 1, " ")}`}
						{task.description ? <Text color={"yellow"}>{task.description}</Text> : ""}
					</Text>
				))}
			</Box>

			<Box marginTop={1}>
				<Text color="cyanBright">Selected tasks: {selectedTasks.join(", ")}</Text>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>[↑↓]: Navigate [Space]: Toggle [Enter]: Run [:q]: Quit [:l]: Clear</Text>
			</Box>
			{isCommandMode && (
				<Box marginTop={1}>
					<Text color="cyanBright">Command: :{commandBuffer}</Text>
				</Box>
			)}
		</Box>
	);
}
