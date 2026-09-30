import type { FC } from "react";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";

import TaskGraph from "./TaskGraph";
import { InstallCommand } from "./shared";

const ArrowIcon: FC = () => (
	<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
	</svg>
);

const Hero: FC = () => (
	<header className="relative overflow-hidden px-4 pt-32 pb-20 md:pt-40 md:pb-28">
		<div aria-hidden className="landing-glow landing-glow-cyan -top-40 left-1/4" />
		<div aria-hidden className="landing-glow landing-glow-violet top-20 right-1/4" />
		<div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
			<span className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
				<span className="w-1.5 h-1.5 rounded-full bg-cyan-400" aria-hidden />
				Type-safe task runner for Node.js
			</span>
			<Heading as="h1" className="landing-display text-5xl md:text-7xl font-extrabold tracking-tight !mb-0">
				Sharp tasks.
				<br />
				<span className="landing-gradient-text">Fast builds.</span>
			</Heading>
			<p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed !mt-0">
				A type-safe, Gradle-inspired task runner. Define tasks once, let Nadle schedule, parallelize, and cache them.
			</p>
			<InstallCommand />
			<div className="flex flex-wrap items-center justify-center gap-4 mt-2">
				<Link className="landing-cta-primary" to="/docs/introduction">
					Get Started
					<ArrowIcon />
				</Link>
				<Link
					className="landing-cta-secondary"
					to="https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true">
					<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
					Try Online
				</Link>
			</div>
		</div>
		<div className="relative z-10 max-w-3xl mx-auto mt-16 md:mt-20">
			<div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-10">
				<TaskGraph />
			</div>
		</div>
	</header>
);

export default Hero;
