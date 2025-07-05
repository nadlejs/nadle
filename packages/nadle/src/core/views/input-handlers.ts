import type React from "react";
import type { Key } from "ink";

import type { VisibleTask } from "./visible-task.js";

export interface Context {
	readonly cursor: number;
	readonly exit: () => void;
	readonly commandBuffer: string;
	readonly isCommandMode: boolean;
	readonly selectedTasks: string[];
	readonly searchingTasks: VisibleTask[];
	readonly onSubmit: (selectedTasks: string[]) => void;
	readonly setCursor: React.Dispatch<React.SetStateAction<number>>;
	readonly setSearchText: React.Dispatch<React.SetStateAction<string>>;
	readonly setCommandBuffer: React.Dispatch<React.SetStateAction<string>>;
	readonly setIsCommandMode: React.Dispatch<React.SetStateAction<boolean>>;
	readonly setSelectedTasks: React.Dispatch<React.SetStateAction<string[]>>;
}

interface InputHandlerParams {
	readonly key: Key;
	readonly input: string;
	readonly context: Context;
}

interface InputHandler {
	handle: (params: InputHandlerParams) => void;
	canHandle: (params: InputHandlerParams) => boolean;
}

const commandHandler: InputHandler = {
	canHandle: ({ context }) => context.isCommandMode,
	handle: ({ key, input, context }) => {
		const { exit, onSubmit, commandBuffer, setSearchText, setCommandBuffer, setIsCommandMode } = context;
		const exitCommandMode = () => {
			setIsCommandMode(false);
			setCommandBuffer("");
		};

		if (key.escape) {
			return exitCommandMode();
		}

		if (key.return) {
			if (commandBuffer === "q") {
				exit();
				onSubmit([]);
			}

			if (commandBuffer === "l") {
				setSearchText("");
			}

			return exitCommandMode();
		}

		setCommandBuffer((prev) => prev + input);
	}
};

const semiColonHandler: InputHandler = {
	canHandle: ({ input }) => input === ":",
	handle: ({ context: { setIsCommandMode, setCommandBuffer } }) => {
		setIsCommandMode(true);
		setCommandBuffer("");
	}
};

const arrowsHandler: InputHandler = {
	canHandle: ({ key }) => key.upArrow || key.downArrow,
	handle: ({ key, context: { setCursor, searchingTasks } }) => {
		if (key.upArrow) {
			setCursor((cursor) => (cursor - 1 + searchingTasks.length) % searchingTasks.length);
		}

		if (key.downArrow) {
			setCursor((cursor) => (cursor + 1 + searchingTasks.length) % searchingTasks.length);
		}
	}
};

const enterHandler: InputHandler = {
	canHandle: ({ key }) => key.return,
	handle: ({ context: { exit, onSubmit, selectedTasks } }) => {
		exit();
		onSubmit(Array.from(selectedTasks));
	}
};

const escapeHandler: InputHandler = {
	canHandle: ({ key }) => key.escape,
	handle: ({ context: { exit } }) => {
		exit();
	}
};

const deleteHandler: InputHandler = {
	canHandle: ({ key }) => key.backspace || key.delete,
	handle: ({ context: { setSearchText } }) => {
		setSearchText((searchText) => searchText.slice(0, -1));
	}
};

const spaceHandler: InputHandler = {
	canHandle: ({ input }) => input === " ",
	handle: ({ context: { cursor, searchingTasks, setSelectedTasks } }) => {
		const { label } = searchingTasks[cursor];

		setSelectedTasks((tasks) => (tasks.includes(label) ? tasks.filter((task) => task !== label) : [...tasks, label]));
	}
};

const fallbackHandler: InputHandler = {
	canHandle: () => true,
	handle: ({ input, context: { setSearchText } }) => {
		setSearchText((currentSearchText) => currentSearchText + input);
	}
};

export const inputHandlers: InputHandler[] = [
	commandHandler,
	semiColonHandler,
	arrowsHandler,
	enterHandler,
	escapeHandler,
	deleteHandler,
	spaceHandler,
	fallbackHandler
];
