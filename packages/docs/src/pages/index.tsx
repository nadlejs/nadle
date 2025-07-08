import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import type { FC, ReactNode } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as codeTheme } from "react-syntax-highlighter/dist/esm/styles/prism";

const HomepageHeader = () => {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="relative overflow-hidden py-20 px-4 text-center bg-gradient-to-br from-[#23272f] via-[#1e293b] to-[#312e81] dark:from-[#181a20] dark:via-[#23272f] dark:to-[#0f172a] text-white">
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
						to="/docs/introduction">
						<span className="flex items-center gap-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
							</svg>
							Get Started
						</span>
					</Link>
					<Link
						className="button button--info button--outline button--lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-pink-200 focus:outline-none border-pink-400 text-pink-300 hover:bg-pink-500/10"
						to="https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true">
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
			<div className="flex items-center gap-3 mb-4 z-10">
				<span>{icon}</span>
				<Heading as="h3" className="text-xl font-bold text-blue-700 dark:text-cyan-300 mb-0">
					{title}
				</Heading>
			</div>
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

const exampleCode = `import { tasks } from "nadle"

tasks.register("build", async () => {
  console.log("Building...");
}).config({
  dependsOn: ["compile", "test"],
  description: "Build the project"
});

// Run with parallel execution
$ nadle build`;

const CodeExample: FC = () => (
	<section className="relative py-24 bg-gradient-to-b from-blue-50 via-white to-cyan-50 dark:from-[#181a20] dark:via-[#23272f] dark:to-[#0f172a] transition-colors overflow-hidden">
		{/* Decorative blurred accent */}
		<div
			aria-hidden
			className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-transparent blur-3xl opacity-60"
		/>
		<div className="container relative z-10">
			<div className="flex flex-col md:flex-row md:items-center gap-12">
				<div className="md:w-1/2 text-center md:text-left">
					<Heading as="h2" className="text-3xl md:text-4xl font-extrabold mb-6 text-blue-900 dark:text-cyan-200 drop-shadow">
						Simple <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">Yet Powerful</span>
					</Heading>
					<p className="text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-200 mb-8 max-w-xl mx-auto md:mx-0">
						Define tasks with <span className="font-semibold text-blue-600 dark:text-cyan-300">clear dependencies</span> and run them with a single
						command.
						<br className="hidden md:inline" />
						<span className="text-pink-600 dark:text-pink-300 font-semibold"> Nadle handles the rest.</span>
					</p>
					<ul className="text-left space-y-4 text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-md mx-auto md:mx-0">
						<li className="flex items-center gap-3">
							<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-cyan-900">
								<svg className="w-5 h-5 text-blue-500 dark:text-cyan-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</span>
							Type-safe, composable tasks
						</li>
						<li className="flex items-center gap-3">
							<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-900">
								<svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="10" />
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
								</svg>
							</span>
							Smart parallel execution
						</li>
						<li className="flex items-center gap-3">
							<span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900">
								<svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
									<rect x="4" y="4" width="16" height="16" rx="4" />
								</svg>
							</span>
							Modern, ESM-first architecture
						</li>
					</ul>
				</div>
				<div className="md:w-1/2 flex justify-center">
					<div className="relative w-full max-w-xl">
						<div className="absolute -top-4 -left-4 w-full h-full rounded-2xl bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-transparent blur-lg z-0" />
						<div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-blue-200 dark:border-gray-800">
							<div className="absolute top-3 left-6 flex gap-2 z-20">
								<span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
								<span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
								<span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
							</div>
							<SyntaxHighlighter
								language="typescript"
								style={codeTheme}
								customStyle={{
									margin: 0,
									lineHeight: "1.6",
									fontSize: "0.98rem",
									borderRadius: "1rem",
									background: "transparent",
									padding: "2rem 1.5rem 1.5rem 1.5rem"
								}}
								showLineNumbers={false}>
								{exampleCode}
							</SyntaxHighlighter>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
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
