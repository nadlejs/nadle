import { ListHandler } from "./list-handler.js";
import { DryRunHandler } from "./dry-run-handler.js";
import { ExecuteHandler } from "./execute-handler.js";
import { CleanCacheHandler } from "./clean-cache-handler.js";
import { ShowConfigHandler } from "./show-config-handler.js";
import { type HandlerConstructor } from "../interfaces/handler.js";
import { ListWorkspacesHandler } from "./list-workspace-handler.js";

export const Handlers: HandlerConstructor[] = [
	ListHandler,
	ListWorkspacesHandler,
	CleanCacheHandler,
	DryRunHandler,
	ShowConfigHandler,
	ExecuteHandler
];
