import { Text } from "ink";
import type React from "react";

import { type Task, PRIMARY_COLOR, SECONDARY_COLOR } from "./tasks-selection.js";

export interface VisibleTask extends Task {
	readonly selected: boolean;
	readonly pointing: boolean;
	readonly TaskLabel: () => React.ReactNode;
}

export namespace VisibleTask {
	export interface Props {
		readonly task: VisibleTask;
	}
}
export const VisibleTask: React.FC<VisibleTask.Props> = ({ task }) => {
	const { label, selected, pointing, TaskLabel, description } = task;

	return (
		<Text color={pointing ? PRIMARY_COLOR : undefined} key={label}>
			{pointing ? ">" : " "} {`[${selected ? "x" : " "}]`} <TaskLabel /> {description ? <Text color={SECONDARY_COLOR}>{description}</Text> : ""}
		</Text>
	);
};
