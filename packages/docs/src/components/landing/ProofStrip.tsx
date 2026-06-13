import type { FC } from "react";
import Link from "@docusaurus/Link";

const CHIPS = ["ESM", "Node 22+", "Zero-config", "Worker threads"];

const ProofStrip: FC = () => (
	<section className="relative px-4 py-10 border-y border-white/[0.06] bg-white/[0.015]">
		<div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
			<Link
				to="https://github.com/nadlejs/nadle/blob/main/nadle.config.ts"
				className="group inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium no-underline hover:no-underline">
				<span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden />
				Nadle builds itself
				<svg
					className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors duration-200"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					viewBox="0 0 24 24"
					aria-hidden>
					<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			</Link>
			<ul className="flex flex-wrap items-center justify-center gap-2.5 list-none p-0 m-0">
				{CHIPS.map((chip) => (
					<li key={chip} className="font-mono text-xs text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5">
						{chip}
					</li>
				))}
			</ul>
		</div>
	</section>
);

export default ProofStrip;
