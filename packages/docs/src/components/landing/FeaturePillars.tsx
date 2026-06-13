import Heading from "@theme/Heading";
import { type FC, type ReactNode } from "react";

import { CodeWindow, TerminalBlock, SectionReveal } from "./shared";

const typeSafetyCode = `import { tasks, defineTask } from "nadle";

interface DeployOptions {
  target: "staging" | "production";
  dryRun: boolean;
}

const DeployTask = defineTask<DeployOptions>({
  run: async ({ options, context }) => {
    context.logger.info(\`Deploying to \${options.target}\`);
  }
});

tasks.register("deploy", DeployTask, {
  target: "staging",
  dryRun: true
});`;

const cachingCode = `tasks.register("compile", ExecTask, {
  command: "tsc",
  args: ["--build"]
}).config({
  inputs: [Inputs.files("src/**/*.ts", "tsconfig.json")],
  outputs: [Outputs.dirs("lib")]
});
// Unchanged inputs? Task is skipped automatically.`;

const parallelTerminal = `$ nadle build

  ● lint        running
  ● compile     running
  ○ test        waiting → compile
  ○ bundle      waiting → compile

  ✓ lint        done  1.2s
  ✓ compile     done  3.4s
  ● test        running
  ● bundle      running`;

interface PillarProps {
	badge: string;
	title: string;
	media: ReactNode;
	reverse?: boolean;
	description: string;
}

const Pillar: FC<PillarProps> = ({ badge, title, media, reverse, description }) => (
	<SectionReveal>
		<div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
			<div className={reverse ? "md:order-2" : ""}>
				<span className="inline-block text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-5 text-cyan-300 bg-cyan-400/10 border border-cyan-400/20">
					{badge}
				</span>
				<h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">{title}</h3>
				<p className="text-slate-400 text-lg leading-relaxed">{description}</p>
			</div>
			<div className={`relative ${reverse ? "md:order-1" : ""}`}>
				<div aria-hidden className="landing-glow landing-glow-blue inset-0 m-auto" />
				<div className="relative z-10">{media}</div>
			</div>
		</div>
	</SectionReveal>
);

const FeaturePillars: FC = () => (
	<section className="relative px-4 py-24 md:py-32">
		<div className="max-w-5xl mx-auto">
			<SectionReveal className="text-center mb-20">
				<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-3">
					Built for <span className="landing-gradient-text">developer experience</span>
				</Heading>
				<p className="text-slate-400 text-lg max-w-2xl mx-auto">Three pillars that set Nadle apart from every other task runner.</p>
			</SectionReveal>
			<div className="space-y-24 md:space-y-32">
				<Pillar
					badge="Type Safety"
					title="Catch errors before they happen"
					description="Define custom task types with generics. Full IntelliSense for task options, configuration errors caught at compile time. TypeScript is the foundation, not an afterthought."
					media={<CodeWindow title="deploy.ts" code={typeSafetyCode} />}
				/>
				<Pillar
					reverse
					badge="Parallelism"
					title="Maximum throughput, zero wasted time"
					description="Nadle builds a dependency graph and runs independent tasks in parallel across worker threads. Watch your pipeline light up as dependencies resolve."
					media={<TerminalBlock content={parallelTerminal} />}
				/>
				<Pillar
					badge="Caching"
					title="Only rebuild what changed"
					description="Declare inputs and outputs for any task. Nadle fingerprints them and skips work when nothing changed. Fast incremental builds out of the box."
					media={<CodeWindow title="nadle.config.ts" code={cachingCode} />}
				/>
			</div>
		</div>
	</section>
);

export default FeaturePillars;
