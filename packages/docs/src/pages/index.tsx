import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import type { FC, ReactNode } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

const HomepageHeader = () => {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="relative overflow-hidden py-20 px-4 text-center bg-gradient-to-br from-[#23272f] via-[#1e293b] to-[#312e81] dark:from-[#181a20] dark:via-[#23272f] dark:to-[#0f172a] text-white">
			{/* Decorative gradients */}
			<div
				aria-hidden
				className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-[#60a5fa]/30 via-[#818cf8]/10 to-transparent blur-3xl opacity-70"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#f472b6]/20 via-[#fbbf24]/10 to-transparent blur-3xl opacity-60"
			/>
			<div className="relative z-10 container flex flex-col items-center">
				<Heading as="h1" className="text-[2.8rem] md:text-[3.5rem] font-extrabold tracking-tight drop-shadow-lg">
					{siteConfig.title}
				</Heading>
				<p className="text-[1.3rem] md:text-[1.6rem] mt-5 mb-10 font-medium text-slate-200 dark:text-slate-300 max-w-2xl mx-auto drop-shadow">
					Modern task runner for Node.js, inspired by Gradle and powered by TypeScript
				</p>
				<div className="flex flex-wrap items-center justify-center gap-4">
					<Link
						className="button button--primary button--lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-blue-300 focus:outline-none bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 border-0 text-white"
						to="/docs/introduction"
					>
						<span className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
							</svg>
							Get Started
						</span>
					</Link>
					<Link
						className="button button--info button--outline button--lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-pink-200 focus:outline-none border-pink-400 text-pink-300 hover:bg-pink-500/10"
						to="https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true"
					>
						<span className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
								<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={2} />
								<path d="M8 8h8v8H8z" fill="currentColor" className="text-pink-400" />
							</svg>
							Try it Online
						</span>
					</Link>
					<span>
						<iframe
							className="overflow-hidden"
							src="https://ghbtns.com/github-btn.html?user=nadlejs&amp;repo=nadle&amp;type=star&amp;count=true&amp;size=large"
							width={160}
							height={30}
							title="GitHub Stars"
						/>
					</span>
				</div>
			</div>
		</header>
	);
};

type FeatureItem = {
	title: string;
	icon: ReactNode;
	description: ReactNode;
};

const FeatureList: FeatureItem[] = [
	{
		title: "Type-Safe by Design",
		description: (
			<>
				Built from the ground up with TypeScript, providing complete type inference and compile-time checks for your build tasks. Catch errors before
				they happen.
			</>
		),
		icon: (
			<svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
				<circle cx="20" cy="20" r="20" fill="#3178C6" />
				<path d="M13 27L27 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
				<circle cx="16" cy="16" r="2.5" fill="#fff" />
				<circle cx="24" cy="24" r="2.5" fill="#fff" />
			</svg>
		)
	},
	{
		title: "Smart Parallel Execution",
		description: (
			<>
				Automatically runs independent tasks in parallel while respecting dependencies. Configurable worker pools ensure optimal resource utilization.
			</>
		),
		icon: (
			<svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
				<rect x="4" y="10" width="32" height="8" rx="4" fill="#34D399" />
				<rect x="4" y="22" width="32" height="8" rx="4" fill="#FBBF24" />
				<rect x="10" y="16" width="20" height="8" rx="4" fill="#60A5FA" />
			</svg>
		)
	},
	{
		title: "Modern Architecture",
		description: (
			<>
				Pure ESM package designed for modern Node.js environments. Zero legacy compatibility compromises, optimized for contemporary development
				workflows.
			</>
		),
		icon: (
			<svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
				<rect x="8" y="8" width="24" height="24" rx="6" fill="#6366F1" />
				<rect x="14" y="14" width="12" height="12" rx="3" fill="#fff" />
			</svg>
		)
	},
	{
		title: "Intuitive Task Management",
		description: (
			<>
				Clear and concise task definitions with explicit dependencies. Group related tasks, add descriptions, and organize your build pipeline
				effectively.
			</>
		),
		icon: (
			<svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
				<rect x="7" y="11" width="26" height="18" rx="4" fill="#F472B6" />
				<rect x="13" y="17" width="14" height="6" rx="2" fill="#fff" />
				<circle cx="13" cy="20" r="2" fill="#FBBF24" />
				<circle cx="27" cy="20" r="2" fill="#34D399" />
			</svg>
		)
	},
	{
		title: "Real-Time Progress",
		description: (
			<>
				Watch your build progress with detailed status updates, progress tracking, and performance metrics. Never wonder about what&#39;s happening
				behind the scenes.
			</>
		),
		icon: (
			<svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
				<circle cx="20" cy="20" r="16" fill="#FBBF24" />
				<path d="M20 8v12l8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
			</svg>
		)
	},
	{
		title: "Extensible Plugin System",
		description: (
			<>
				Extend Nadle&#39;s capabilities with plugins. Create custom task types, add build hooks, and integrate with your favorite tools and services.
			</>
		),
		icon: (
			<svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
				<rect x="8" y="8" width="24" height="24" rx="6" fill="#34D399" />
				<path d="M20 14v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
				<path d="M14 20h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
			</svg>
		)
	}
];

const Feature: FC<FeatureItem> = ({ icon, title, description }) => (
	<div className="col col--4 mb-10">
		<div className="h-full flex flex-col items-start bg-gradient-to-br from-white via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 p-8 transition-transform hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl relative overflow-hidden">
			{/* Decorative blurred accent */}
			<div
				aria-hidden
				className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-transparent blur-2xl opacity-60"
			/>
			<div className="mb-4 z-10">{icon}</div>
			<Heading as="h3" className="text-xl font-bold mb-3 text-blue-700 dark:text-cyan-300 z-10">
				{title}
			</Heading>
			<p className="text-base leading-relaxed text-gray-700 dark:text-gray-200 flex-1 z-10">{description}</p>
		</div>
	</div>
);

const HomepageFeatures = () => (
	<section className="flex items-center w-full py-20 bg-gradient-to-b from-slate-50 via-white to-blue-50 dark:from-[#181a20] dark:via-[#23272f] dark:to-[#0f172a] transition-colors">
		<div className="container">
			<div className="row">
				{FeatureList.map((props, idx) => (
					<Feature key={idx} {...props} />
				))}
			</div>
		</div>
	</section>
);

const CodeExample: FC = () => (
	<div className="py-16 bg-background">
		{" "}
		<div className="container">
			<div className="row">
				<div className="col col--6">
					<Heading as="h2" className="text-2xl font-bold mb-4">
						Simple Yet Powerful
					</Heading>
					<p className="text-[1.2rem] leading-[1.6] text-emphasis-700 mb-8">
						Define tasks with clear dependencies and run them with a single command. Nadle handles the rest.
					</p>
				</div>
				<div className="col col--6">
					<pre className="bg-pre-background rounded-code p-6 m-0 overflow-auto text-[0.9rem] leading-[1.5]">
						<code className="block text-emphasis-900 font-mono">
							{`import { tasks } from "nadle";

// Define tasks with dependencies
tasks.register("build", async () => {
  console.log("Building...");
}).config({
  dependsOn: ["compile", "test"],
  description: "Build the project"
});

// Run with parallel execution
$ nadle build`}
						</code>
					</pre>
				</div>
			</div>
		</div>
	</div>
);

const HomePage = () => {
	const { siteConfig } = useDocusaurusContext();

	return (
		<Layout title={`${siteConfig.title} - ${siteConfig.tagline}`} description="A modern, type-safe task runner for Node.js inspired by Gradle">
			<HomepageHeader />
			<main>
				<HomepageFeatures />
				<CodeExample />
			</main>
		</Layout>
	);
};

export default HomePage;
