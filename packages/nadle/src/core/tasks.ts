/**
 * Core task registration API for Nadle.
 *
 * Provides a type-safe interface for registering tasks, with or without options and custom resolvers.
 *
 * @module core/tasks
 */

import { registerTask } from "./registration/register-task.js";
import { type Task, type TaskFn, type Resolver, type ConfigBuilder } from "./types.js";

/**
 * The Tasks interface exposes overloaded `register` methods for defining tasks.
 */
export interface Tasks {
	/**
	 * Register a task by name only.
	 * @param name - The unique name of the task.
	 * @returns ConfigBuilder for further configuration.
	 */
	register(name: string): ConfigBuilder;

	/**
	 * Register a task with a task function.
	 * @param name - The unique name of the task.
	 * @param fnTask - The function to execute for this task.
	 * @returns ConfigBuilder for further configuration.
	 */
	register(name: string, fnTask: TaskFn): ConfigBuilder;

	/**
	 * Register a task with options and a resolver.
	 * @param name - The unique name of the task.
	 * @param optTask - The task definition with options.
	 * @param optionsResolver - A resolver for the task's options.
	 * @returns ConfigBuilder for further configuration.
	 */
	register<Options>(name: string, optTask: Task<Options>, optionsResolver: Resolver<Options>): ConfigBuilder;
}

/**
 * The main tasks API instance for registering tasks.
 */
export const tasks: Tasks = {
	register: registerTask
};
