import type { FC } from "react";
import Heading from "@theme/Heading";

import { SectionReveal } from "./shared";

const TOOLS = ["nadle", "npm scripts", "Turborepo", "Nx"] as const;

interface Row {
	feature: string;
	values: [boolean, boolean, boolean, boolean];
}

const ROWS: Row[] = [
	{ feature: "Type-safe config", values: [true, false, false, false] },
	{ feature: "DAG scheduling", values: [true, false, true, true] },
	{ feature: "Built-in caching", values: [true, false, true, true] },
	{ feature: "Parallel execution", values: [true, false, true, true] },
	{ feature: "Monorepo-native", values: [true, false, true, true] }
];

const Check: FC = () => (
	<svg className="w-5 h-5 text-emerald-400 inline" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
	</svg>
);

const Dash: FC = () => (
	<svg className="w-5 h-5 text-slate-600 inline" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" d="M6 12h12" />
	</svg>
);

const Comparison: FC = () => (
	<section className="relative px-4 py-24 md:py-28">
		<SectionReveal className="max-w-4xl mx-auto">
			<div className="text-center mb-12">
				<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-3">
					How Nadle <span className="landing-gradient-text">compares</span>
				</Heading>
				<p className="text-slate-400 text-lg">Everything evaluators look for, without leaving TypeScript.</p>
			</div>
			<div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]">
				<table className="w-full text-sm border-collapse min-w-[560px]">
					<thead>
						<tr className="border-b border-white/[0.08]">
							<th className="text-left font-medium text-slate-400 px-5 py-4">Feature</th>
							{TOOLS.map((tool) => (
								<th key={tool} className={`px-5 py-4 text-center font-semibold ${tool === "nadle" ? "text-cyan-400" : "text-slate-300"}`}>
									{tool}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{ROWS.map((row) => (
							<tr key={row.feature} className="border-b border-white/[0.05] last:border-0">
								<td className="text-left text-slate-200 px-5 py-3.5">{row.feature}</td>
								{row.values.map((value, i) => (
									<td key={TOOLS[i]} className={`px-5 py-3.5 text-center ${i === 0 ? "bg-cyan-400/[0.04]" : ""}`}>
										{value ? <Check /> : <Dash />}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</SectionReveal>
	</section>
);

export default Comparison;
