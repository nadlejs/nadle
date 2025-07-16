import React from "react";
import { Text } from "ink";
import fuzzySort from "fuzzysort";

import { type VisibleTask } from "./visible-task.js";
import { HIGHLIGHT_COLOR, type InteractiveTask } from "./tasks-selection.js";

const VISIBLE_TASKS_LIMIT = 5;

export function useSearching(tasks: InteractiveTask[], searchText: string, selectedTasks: string[], cursor: number): VisibleTask[] {
	return React.useMemo(() => {
		if (!searchText) {
			const visibleTasks = tasks.slice(0, VISIBLE_TASKS_LIMIT);
			const maxLength = Math.max(...visibleTasks.map((task) => task.label.length));

			return visibleTasks.map<VisibleTask>((task) => {
				return {
					...task,
					pointing: cursor === tasks.indexOf(task),
					selected: selectedTasks.includes(task.id),
					TaskLabel: () => task.label.padEnd(maxLength, " ")
				};
			});
		}

		const filteredTasks = fuzzySort.go<InteractiveTask>(searchText, tasks, { key: "label", limit: VISIBLE_TASKS_LIMIT });
		const maxLength = Math.max(...filteredTasks.map((task) => task.obj.label.length));

		return filteredTasks.map<VisibleTask>((task) => {
			return {
				...task.obj,
				selected: selectedTasks.includes(task.obj.id),
				pointing: cursor === filteredTasks.indexOf(task),
				TaskLabel: () => <HighlightedTaskLabel task={task} marginRight={maxLength - task.obj.label.length} />
			};
		});
	}, [cursor, searchText, selectedTasks, tasks]);
}

const HighlightedTaskLabel: React.FC<{ marginRight: number; task: Fuzzysort.KeyResult<InteractiveTask> }> = (props) => {
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
