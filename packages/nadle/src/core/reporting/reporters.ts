/**
 * Available output reporters.
 *
 * - `default`: human-oriented output with colors and an optional in-progress footer.
 * - `agent`: compact, plain, low-noise output for AI agents and scripts.
 */
export const SupportReporters = ["default", "agent"] as const;

/** A supported output reporter name. */
export type SupportReporter = (typeof SupportReporters)[number];
