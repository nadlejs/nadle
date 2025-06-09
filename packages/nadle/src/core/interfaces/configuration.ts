import { type Callback } from "./common.js";
import { type TaskConfiguration } from "./task.js";

export interface ConfigBuilder {
	config(builder: Callback<TaskConfiguration> | TaskConfiguration): void;
}
