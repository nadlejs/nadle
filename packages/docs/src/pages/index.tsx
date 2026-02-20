import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import { themes, Highlight } from "prism-react-renderer";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useRef, type FC, useCallback, type ReactNode } from "react";

/* ─── Shared Inline Components ────────────────────────────────────────────── */

const CodeWindow: FC<{ code: string; title: string }> = ({ code, title }) => (
	<div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
		<div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/40">
			<span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
			<span className="w-3 h-3 rounded-full bg-[#febc2e]" />
			<span className="w-3 h-3 rounded-full bg-[#28c840]" />
			<span className="ml-2 text-xs text-slate-400 font-mono">{title}</span>
		</div>
		<Highlight theme={themes.vsDark} code={code} language="typescript">
			{({ tokens, getLineProps, getTokenProps }) => (
				<pre className="!m-0 !rounded-none !bg-transparent" style={{ lineHeight: "1.7", fontSize: "0.88rem", padding: "1.25rem 1.5rem" }}>
					{tokens.map((line, i) => (
						<div key={i} {...getLineProps({ line })}>
							{line.map((token, key) => (
								<span key={key} {...getTokenProps({ token })} />
							))}
						</div>
					))}
				</pre>
			)}
		</Highlight>
	</div>
);

const INSTALL_COMMAND = "npm install -D nadle";

const InstallCommand: FC = () => {
	const btnRef = useRef<HTMLButtonElement>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleCopy = useCallback(() => {
		void navigator.clipboard.writeText(INSTALL_COMMAND);
		const el = btnRef.current;

		if (!el) {
			return;
		}

		el.dataset["copied"] = "";
		clearTimeout(timerRef.current!);
		timerRef.current = setTimeout(() => delete el.dataset["copied"], 2000);
	}, []);

	return (
		<button
			ref={btnRef}
			type="button"
			onClick={handleCopy}
			className="group inline-flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-lg px-5 py-3 font-mono text-sm transition-colors duration-200 cursor-pointer"
			aria-label={`Copy install command: ${INSTALL_COMMAND}`}>
			<span className="text-green-400">$</span>
			<span className="text-slate-200">{INSTALL_COMMAND}</span>
			<span className="ml-1 text-slate-500 group-hover:text-slate-300 transition-colors duration-200 group-data-[copied]:hidden">
				<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
					<rect x="9" y="9" width="13" height="13" rx="2" />
					<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
				</svg>
			</span>
			<span className="ml-1 hidden group-data-[copied]:inline">
				<svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</span>
		</button>
	);
};

/* ─── Section 1: Hero ─────────────────────────────────────────────────────── */

const Hero: FC = () => {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="relative overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-24 md:py-32 px-4">
			<div
				aria-hidden
				className="pointer-events-none absolute w-[500px] h-[500px] -top-40 -left-40 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute w-[400px] h-[400px] -bottom-32 -right-32 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.15)_0%,_transparent_70%)]"
			/>
			<div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
				<Heading as="h1" className="text-5xl md:text-7xl font-extrabold tracking-tight text-white !mb-0">
					{siteConfig.title}
				</Heading>
				<p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
					{siteConfig.tagline}
				</p>
				<p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed !mt-0">A type-safe, Gradle-inspired task runner for Node.js.</p>
				<InstallCommand />
				<div className="flex flex-wrap items-center justify-center gap-4 mt-2">
					<Link
						className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-white font-semibold rounded-lg px-6 py-3 text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/25 no-underline hover:no-underline hover:text-white"
						to="/docs/introduction">
						Get Started
						<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</Link>
					<Link
						className="inline-flex items-center gap-2 bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 font-medium rounded-lg px-6 py-3 text-sm transition-colors duration-200 cursor-pointer no-underline hover:no-underline"
						to="https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
						Try Online
					</Link>
					<iframe
						className="overflow-hidden"
						src="https://ghbtns.com/github-btn.html?user=nadlejs&amp;repo=nadle&amp;type=star&amp;count=true&amp;size=large"
						width={140}
						height={30}
						title="GitHub Stars"
						loading="lazy"
					/>
				</div>
			</div>
		</header>
	);
};

/* ─── Section 2: Code Showcase ────────────────────────────────────────────── */

const showcaseCode = `import { tasks, ExecTask, Inputs, Outputs } from "nadle";

tasks.register("compile", ExecTask, {
  command: "tsc",
  args: ["--build"]
}).config({
  inputs: [Inputs.files("src/**/*.ts", "tsconfig.json")],
  outputs: [Outputs.dirs("lib")],
  description: "Compile TypeScript sources"
});

tasks.register("test", ExecTask, {
  command: "vitest",
  args: ["run"]
}).config({
  dependsOn: ["compile"],
  description: "Run test suite"
});

tasks.register("build").config({
  dependsOn: ["compile", "test"]
});`;

const CodeShowcase: FC = () => (
	<section className="relative bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0d1117] py-20 md:py-28 px-4 overflow-hidden">
		<div
			aria-hidden
			className="pointer-events-none absolute w-[600px] h-[300px] -top-20 left-1/2 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]"
		/>
		<div className="relative z-10 max-w-6xl mx-auto">
			<div className="grid md:grid-cols-[2fr_3fr] gap-12 md:gap-16 items-center">
				<div>
					<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-4">
						Simple yet <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">powerful</span>
					</Heading>
					<p className="text-slate-400 text-lg leading-relaxed mb-8">
						Define tasks with clear dependencies and let Nadle handle scheduling, parallelism, and caching.
					</p>
					<ul className="space-y-4">
						{[
							{ color: "text-blue-400 bg-blue-400/10", text: "Type-safe tasks with full IntelliSense" },
							{ text: "DAG-based parallel scheduling", color: "text-amber-400 bg-amber-400/10" },
							{ color: "text-emerald-400 bg-emerald-400/10", text: "Built-in caching for incremental builds" }
						].map(({ text, color }) => (
							<li key={text} className="flex items-center gap-3 text-slate-300">
								<span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${color}`}>
									<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</span>
								{text}
							</li>
						))}
					</ul>
				</div>
				<CodeWindow title="nadle.config.ts" code={showcaseCode} />
			</div>
		</div>
	</section>
);

/* ─── Section 3: Feature Highlights ───────────────────────────────────────── */

const typeSafetyCode = `import { tasks, defineTask } from "nadle";

interface DeployOptions {
  target: "staging" | "production";
  dryRun: boolean;
}

const DeployTask = defineTask<DeployOptions>({
  run: async ({ options, context }) => {
    context.logger.info(\`Deploying to \${options.target}...\`);
  }
});

tasks.register("deploy", DeployTask, {
  target: "staging",
  dryRun: true
});`;

const cachingCode = `import { tasks, ExecTask, Inputs, Outputs } from "nadle";

tasks.register("compile", ExecTask, {
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

interface HighlightProps {
	badge: string;
	title: string;
	glowClass: string;
	reverse?: boolean;
	badgeClass: string;
	accentClass: string;
	description: string;
	children: ReactNode;
}

const FeatureHighlight: FC<HighlightProps> = ({ badge, title, reverse, children, glowClass, badgeClass, accentClass, description }) => (
	<div className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${reverse ? "md:[direction:rtl]" : ""}`}>
		<div className={reverse ? "md:[direction:ltr]" : ""}>
			<span className={`inline-block text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-5 ${badgeClass}`}>{badge}</span>
			<h3 className={`text-2xl md:text-3xl font-bold mb-4 ${accentClass}`}>{title}</h3>
			<p className="text-slate-400 text-lg leading-relaxed">{description}</p>
		</div>
		<div className={`relative ${reverse ? "md:[direction:ltr]" : ""}`}>
			<div
				aria-hidden
				className={`pointer-events-none absolute w-72 h-72 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${glowClass}`}
			/>
			<div className="relative z-10">{children}</div>
		</div>
	</div>
);

const TerminalBlock: FC<{ content: string }> = ({ content }) => (
	<div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
		<div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/40">
			<span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
			<span className="w-3 h-3 rounded-full bg-[#febc2e]" />
			<span className="w-3 h-3 rounded-full bg-[#28c840]" />
			<span className="ml-2 text-xs text-slate-400 font-mono">Terminal</span>
		</div>
		<pre className="p-5 text-sm leading-relaxed font-mono overflow-x-auto !bg-[#1d2433] !m-0 !rounded-none text-slate-300">{content}</pre>
	</div>
);

const FeatureHighlights: FC = () => (
	<section className="relative bg-[#0a0f1a] py-24 md:py-32 px-4 overflow-hidden">
		<div className="max-w-6xl mx-auto">
			<div className="text-center mb-20">
				<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-3">
					Built for{" "}
					<span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">developer experience</span>
				</Heading>
				<p className="text-slate-400 text-lg max-w-2xl mx-auto">Three pillars that make Nadle different from every other task runner.</p>
			</div>
			<div className="space-y-28 md:space-y-36">
				<FeatureHighlight
					badge="Type Safety"
					badgeClass="bg-blue-500/10 text-blue-400"
					title="Catch errors before they happen"
					accentClass="text-white"
					glowClass="bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)]"
					description="Define custom task types with generics. Get full IntelliSense for task options and catch configuration errors at compile time. TypeScript isn't bolted on — it's the foundation.">
					<CodeWindow title="deploy.ts" code={typeSafetyCode} />
				</FeatureHighlight>

				<FeatureHighlight
					badge="Parallelism"
					badgeClass="bg-amber-500/10 text-amber-400"
					title="Maximum throughput, zero wasted time"
					accentClass="text-white"
					glowClass="bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.15)_0%,_transparent_70%)]"
					description="Nadle builds a dependency graph and runs independent tasks in parallel using worker threads. Watch your build pipeline light up."
					reverse>
					<TerminalBlock content={parallelTerminal} />
				</FeatureHighlight>

				<FeatureHighlight
					badge="Caching"
					badgeClass="bg-emerald-500/10 text-emerald-400"
					title="Only rebuild what changed"
					accentClass="text-white"
					glowClass="bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]"
					description="Declare inputs and outputs for any task. Nadle fingerprints them and skips tasks when nothing has changed. Fast incremental builds out of the box.">
					<CodeWindow title="nadle.config.ts" code={cachingCode} />
				</FeatureHighlight>
			</div>
		</div>
	</section>
);

/* ─── Section 4: Feature Grid ─────────────────────────────────────────────── */

interface FeatureCardProps {
	title: string;
	iconBg: string;
	icon: ReactNode;
	iconColor: string;
	glowColor: string;
	description: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, iconBg, iconColor, glowColor, description }) => (
	<div className="group relative bg-white/[0.03] border border-slate-700/50 rounded-2xl p-7 transition-all duration-300 hover:border-transparent cursor-default overflow-hidden">
		{/* Hover glow */}
		<div
			aria-hidden
			className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${glowColor}`}
		/>
		{/* Hover border gradient via ring */}
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-cyan-400/20 transition-all duration-300"
		/>
		<div className="relative z-10">
			<div className={`w-11 h-11 mb-5 rounded-xl flex items-center justify-center ${iconBg}`}>
				<div className={`w-5 h-5 ${iconColor}`}>{icon}</div>
			</div>
			<h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
			<p className="text-sm text-slate-400 leading-relaxed">{description}</p>
		</div>
	</div>
);

const featureCards: FeatureCardProps[] = [
	{
		title: "Smart CLI",
		iconBg: "bg-violet-500/10",
		iconColor: "text-violet-400",
		glowColor: "bg-gradient-to-br from-violet-500/10 to-transparent",
		description: "Abbreviation matching, autocorrection, dry run, and summary mode. Run tasks with minimal typing.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<rect x="3" y="4" width="18" height="16" rx="2" />
				<path d="M7 12l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
				<path d="M13 18h4" strokeLinecap="round" />
			</svg>
		)
	},
	{
		iconBg: "bg-amber-500/10",
		title: "Real-Time Progress",
		iconColor: "text-amber-400",
		glowColor: "bg-gradient-to-br from-amber-500/10 to-transparent",
		description: "Interactive footer shows scheduled, running, and completed tasks as they execute.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		)
	},
	{
		iconBg: "bg-sky-500/10",
		title: "Monorepo-Native",
		iconColor: "text-sky-400",
		glowColor: "bg-gradient-to-br from-sky-500/10 to-transparent",
		description: "First-class workspace support. Run tasks across packages with dependency awareness.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<rect x="3" y="3" width="7" height="7" rx="1.5" />
				<rect x="14" y="3" width="7" height="7" rx="1.5" />
				<rect x="8.5" y="14" width="7" height="7" rx="1.5" />
				<path d="M6.5 10v2.5a1 1 0 001 1H12m5.5-3.5v2.5a1 1 0 01-1 1H12m0 0v1.5" strokeLinecap="round" />
			</svg>
		)
	},
	{
		title: "Built-in Tasks",
		iconBg: "bg-pink-500/10",
		iconColor: "text-pink-400",
		glowColor: "bg-gradient-to-br from-pink-500/10 to-transparent",
		description: "ExecTask, PnpmTask, CopyTask, DeleteTask. Common operations ready out of the box.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<path
					d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		)
	},
	{
		iconBg: "bg-cyan-500/10",
		iconColor: "text-cyan-400",
		title: "Modern Architecture",
		glowColor: "bg-gradient-to-br from-cyan-500/10 to-transparent",
		description: "Pure ESM, Node.js 22+, worker thread isolation. Zero legacy compromises.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		)
	},
	{
		title: "Zero Config",
		iconBg: "bg-emerald-500/10",
		iconColor: "text-emerald-400",
		glowColor: "bg-gradient-to-br from-emerald-500/10 to-transparent",
		description: "Works immediately with sensible defaults. A single nadle.config.ts is all you need.",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
				<path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
				<circle cx="12" cy="12" r="9" />
			</svg>
		)
	}
];

const FeatureGrid: FC = () => (
	<section className="relative bg-[#0d1117] py-24 md:py-32 px-4 overflow-hidden">
		<div
			aria-hidden
			className="pointer-events-none absolute w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.08)_0%,_transparent_70%)]"
		/>
		<div className="relative z-10 max-w-6xl mx-auto">
			<div className="text-center mb-16">
				<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-3">
					Everything you need
				</Heading>
				<p className="text-slate-400 text-lg max-w-lg mx-auto">Batteries included, no bloat. Every feature earns its place.</p>
			</div>
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{featureCards.map((props) => (
					<FeatureCard key={props.title} {...props} />
				))}
			</div>
		</div>
	</section>
);

/* ─── Section 5: Credibility ──────────────────────────────────────────────── */

const Credibility: FC = () => (
	<section className="bg-[#0a0f1a] py-16 md:py-20 px-4">
		<div className="max-w-3xl mx-auto">
			<div className="border-l-4 border-cyan-500 pl-6 md:pl-8">
				<h3 className="text-xl md:text-2xl font-bold text-white mb-3">Nadle Builds Itself</h3>
				<p className="text-slate-400 text-base leading-relaxed mb-4">
					We use Nadle to build, test, and release Nadle. A real-world task graph with caching, parallel execution, and monorepo orchestration.
				</p>
				<Link
					className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-200 cursor-pointer no-underline hover:no-underline"
					to="https://github.com/nadlejs/nadle/blob/main/nadle.config.ts">
					View nadle.config.ts
					<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</Link>
			</div>
		</div>
	</section>
);

/* ─── Section 6: Final CTA ────────────────────────────────────────────────── */

const FinalCTA: FC = () => (
	<section className="relative overflow-hidden bg-gradient-to-b from-[#0d1117] via-[#1e293b] to-[#0f172a] text-white py-20 md:py-28 px-4">
		<div
			aria-hidden
			className="pointer-events-none absolute w-[400px] h-[400px] -top-32 -right-32 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.15)_0%,_transparent_70%)]"
		/>
		<div
			aria-hidden
			className="pointer-events-none absolute w-[300px] h-[300px] -bottom-20 -left-20 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)]"
		/>
		<div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
			<Heading as="h2" className="text-3xl md:text-4xl font-bold text-white !mb-0">
				Ready to get started?
			</Heading>
			<p className="text-slate-400 text-lg">Install Nadle and run your first task in under 2 minutes.</p>
			<InstallCommand />
			<Link
				className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-white font-semibold rounded-lg px-8 py-3.5 text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/25 no-underline hover:no-underline hover:text-white"
				to="/docs/introduction">
				Get Started
				<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			</Link>
		</div>
	</section>
);

/* ─── Page Layout ─────────────────────────────────────────────────────────── */

const HomePage: FC = () => (
	<Layout title="Sharp tasks. Fast builds." description="A type-safe, Gradle-inspired task runner for Node.js. Sharp tasks. Fast builds.">
		<main>
			<Hero />
			<CodeShowcase />
			<FeatureHighlights />
			<FeatureGrid />
			<Credibility />
			<FinalCTA />
		</main>
	</Layout>
);

export default HomePage;
