import React from "react";
import { Text } from "ink";
import fuzzySort from "fuzzysort";

import { type VisibleTask } from "./visible-task.js";
import { type Task, HIGHLIGHT_COLOR } from "./tasks-selection.js";

const VISIBLE_TASKS_LIMIT = 5;

export function useSearching(tasks: Task[], searchText: string, selectedTasks: string[], cursor: number): VisibleTask[] {
	return React.useMemo(() => {
		if (!searchText) {
			const visibleTasks = tasks.slice(0, VISIBLE_TASKS_LIMIT);
			const maxLength = Math.max(...visibleTasks.map((task) => task.name.length));

			return visibleTasks.map<VisibleTask>((task) => {
				return {
					...task,
					pointing: cursor === tasks.indexOf(task),
					selected: selectedTasks.includes(task.name),
					TaskName: () => task.name.padEnd(maxLength, " ")
				};
			});
		}

		const filteredTasks: Fuzzysort.KeyResults<Task> = fuzzySort.go<Task>(searchText, tasks, { key: "name" });
		const maxLength = Math.max(...filteredTasks.map((task) => task.obj.name.length));

		return filteredTasks.slice(0, VISIBLE_TASKS_LIMIT).map<VisibleTask>((task) => {
			return {
				...task.obj,
				selected: selectedTasks.includes(task.obj.name),
				pointing: cursor === filteredTasks.indexOf(task),
				TaskName: () => <HighlightedTaskName task={task} marginRight={maxLength - task.obj.name.length} />
			};
		});
	}, [cursor, searchText, selectedTasks, tasks]);
}

const HighlightedTaskName: React.FC<{ marginRight: number; task: Fuzzysort.KeyResult<Task> }> = (props) => {
	const { task, marginRight } = props;

	return (
		<>
			{task
				.highlight((char, charIndex) => (
					<Text key={charIndex} color={HIGHLIGHT_COLOR}>
						{char}
					</Text>
				))
				.map((part, i) => (typeof part === "string" ? <Text key={i}>{part}</Text> : <React.Fragment key={i}>{part}</React.Fragment>))}
			{" ".repeat(marginRight)}
		</>
	);
};
