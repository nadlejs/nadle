import Heading from "@theme/Heading";
import { type FC, type ReactNode } from "react";

import { SectionReveal } from "./shared";

const icons: Record<string, ReactNode> = {
	architecture: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />,
	progress: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
		</>
	),
	agent: (
		<>
			<rect x="4" y="6" width="16" height="12" rx="2" />
			<path d="M9 11h6M9 14h3" strokeLinecap="round" />
			<path d="M12 2v4M8 22h8" strokeLinecap="round" />
		</>
	),
	cli: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<path d="M7 12l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M13 18h4" strokeLinecap="round" />
		</>
	),
	builtin: (
		<path
			d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	),
	monorepo: (
		<>
			<rect x="3" y="3" width="7" height="7" rx="1.5" />
			<rect x="14" y="3" width="7" height="7" rx="1.5" />
			<rect x="8.5" y="14" width="7" height="7" rx="1.5" />
			<path d="M6.5 10v2.5a1 1 0 001 1H12m5.5-3.5v2.5a1 1 0 01-1 1H12m0 0v1.5" strokeLinecap="round" />
		</>
	)
};

interface Card {
	icon: string;
	title: string;
	description: string;
}

const CARDS: Card[] = [
	{
		icon: "cli",
		title: "Smart CLI",
		description: "Abbreviation matching, autocorrection, dry run, and summary mode. Run tasks with minimal typing."
	},
	{
		icon: "progress",
		title: "Real-time progress",
		description: "Interactive footer shows scheduled, running, and completed tasks live as they execute."
	},
	{
		icon: "monorepo",
		title: "Monorepo-native",
		description: "First-class workspace support. Run tasks across packages with full dependency awareness."
	},
	{ icon: "builtin", title: "Built-in tasks", description: "ExecTask, PnpmTask, CopyTask, DeleteTask. Common operations ready out of the box." },
	{ icon: "architecture", title: "Modern architecture", description: "Pure ESM, Node.js 22+, worker-thread isolation. Zero legacy compromises." },
	{ icon: "agent", title: "Agent-ready", description: "Ships llms.txt and llms-full.txt so AI agents can discover and reason about your tasks." }
];

const FeatureCard: FC<{ card: Card }> = ({ card }) => (
	<div className="landing-feature-card group relative rounded-2xl p-7 overflow-hidden">
		<div aria-hidden className="landing-feature-card-glow" />
		<div className="relative z-10">
			<div className="w-11 h-11 mb-5 rounded-xl flex items-center justify-center bg-white/[0.05] text-cyan-400">
				<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
					{icons[card.icon]}
				</svg>
			</div>
			<h3 className="text-base font-semibold text-slate-100 mb-2">{card.title}</h3>
			<p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
		</div>
	</div>
);

const FeatureGrid: FC = () => (
	<section className="relative px-4 py-24 md:py-32 bg-white/[0.015] border-y border-white/[0.06]">
		<div className="max-w-5xl mx-auto">
			<SectionReveal className="text-center mb-16">
				<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-3">
					Everything you need
				</Heading>
				<p className="text-slate-400 text-lg max-w-lg mx-auto">Batteries included, no bloat. Every feature earns its place.</p>
			</SectionReveal>
			<SectionReveal>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{CARDS.map((card) => (
						<FeatureCard key={card.title} card={card} />
					))}
				</div>
			</SectionReveal>
		</div>
	</section>
);

export default FeatureGrid;
