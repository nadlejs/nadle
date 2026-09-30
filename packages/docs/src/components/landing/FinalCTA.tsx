import type { FC } from "react";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";

import { SectionReveal, InstallCommand } from "./shared";

const FinalCTA: FC = () => (
	<section className="relative px-4 py-24 md:py-32">
		<SectionReveal className="max-w-3xl mx-auto">
			<div className="landing-cta-panel relative overflow-hidden rounded-3xl px-6 py-16 md:px-12 md:py-20 text-center">
				<div aria-hidden className="landing-glow landing-glow-violet -top-24 right-0" />
				<div aria-hidden className="landing-glow landing-glow-cyan -bottom-24 left-0" />
				<div className="relative z-10 flex flex-col items-center gap-6">
					<Heading as="h2" className="text-3xl md:text-5xl font-bold text-white !mb-0">
						Ready to get started?
					</Heading>
					<p className="text-slate-300 text-lg max-w-md">Install Nadle and run your first task in under two minutes.</p>
					<InstallCommand />
					<Link className="landing-cta-primary" to="/docs/introduction">
						Get Started
						<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</Link>
				</div>
			</div>
		</SectionReveal>
	</section>
);

export default FinalCTA;
