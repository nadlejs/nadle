import { ConfigurationError } from "../utilities/nadle-error.js";
import { type NadlePlugin, type PluginReporter } from "./plugin.js";

interface AppliedPlugin {
	readonly options: unknown;
	readonly plugin: NadlePlugin<never>;
}

const ENFORCE_ORDER = { pre: 0, post: 2, normal: 1 } as const;
const BUILTIN_REPORTERS = new Set(["default", "agent"]);

export class PluginRegistry {
	private readonly applied = new Map<string, AppliedPlugin>();
	private readonly reporters = new Map<string, PluginReporter["create"]>();

	public apply(plugin: NadlePlugin<never>, options?: unknown): void {
		const existing = this.applied.get(plugin.name);

		if (existing) {
			// Re-applying the same plugin with identical options is a no-op (so a
			// meta-plugin and the user can both apply it); differing options is ambiguous.
			if (deepEqual(existing.options, options)) {
				return;
			}

			throw new ConfigurationError(`Plugin ${plugin.name} is already applied with different options.`);
		}

		for (const reporter of plugin.reporters ?? []) {
			this.registerReporter(reporter);
		}

		this.applied.set(plugin.name, { plugin, options });
	}

	private registerReporter(reporter: PluginReporter): void {
		if (BUILTIN_REPORTERS.has(reporter.name) || this.reporters.has(reporter.name)) {
			throw new ConfigurationError(`Reporter name "${reporter.name}" is already registered.`);
		}

		this.reporters.set(reporter.name, reporter.create);
	}

	public getReporter(name: string): PluginReporter["create"] | undefined {
		return this.reporters.get(name);
	}

	public getReporterNames(): string[] {
		return [...this.reporters.keys()];
	}

	public getApplied(): AppliedPlugin[] {
		return [...this.applied.values()];
	}

	public getOrdered(): AppliedPlugin[] {
		// Stable sort by enforce group (pre → normal → post); application order is
		// preserved within each group because Array.prototype.sort is stable.
		return this.getApplied().sort((a, b) => ENFORCE_ORDER[a.plugin.enforce ?? "normal"] - ENFORCE_ORDER[b.plugin.enforce ?? "normal"]);
	}
}

/** Structural, key-order-insensitive equality for plugin option objects. */
function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true;
	}

	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
		return false;
	}

	if (Array.isArray(a) || Array.isArray(b)) {
		return arrayEqual(a, b);
	}

	return objectEqual(a as Record<string, unknown>, b as Record<string, unknown>);
}

function arrayEqual(a: unknown, b: unknown): boolean {
	return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
}

function objectEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
	const aKeys = Object.keys(a);

	return aKeys.length === Object.keys(b).length && aKeys.every((key) => key in b && deepEqual(a[key], b[key]));
}
