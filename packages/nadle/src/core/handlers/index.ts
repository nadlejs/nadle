import { ListHandler } from "./list-handler.js";
import { DryRunHandler } from "./dry-run-handler.js";
import { ExecuteHandler } from "./execute-handler.js";
import { CleanCacheHandler } from "./clean-cache-handler.js";
import { ShowConfigHandler } from "./show-config-handler.js";
import { type HandlerConstructor } from "../interfaces/handler.js";

export const Handlers: HandlerConstructor[] = [ListHandler, CleanCacheHandler, DryRunHandler, ShowConfigHandler, ExecuteHandler];
