export interface Context {
	env: NodeJS.ProcessEnv;
}

export type ContextualResolver<T = unknown> = (params: { context: Context }) => T;
export type Resolver<T = unknown> = T | ContextualResolver<T>;

export type TaskFn = ContextualResolver<Promise<void> | void>;

export interface Task<Options = unknown> {
	run(params: { options: Options; context: Context }): Promise<void> | void;
}

export interface TaskConfiguration {
	dependsOn?: string[];
}

export interface ConfigBuilder {
	config(builder: ContextualResolver<TaskConfiguration> | TaskConfiguration): void;
}

export interface RegisteredTask extends Task {
	name: string;
	optionsResolver: Resolver | undefined;
	configResolver: ContextualResolver<TaskConfiguration>;
}
