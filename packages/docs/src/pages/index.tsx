import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import type { ReactNode } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className="py-16 text-center relative overflow-hidden bg-[#2b3137] text-white maxLg:p-8">
			<div className="container">
				<Heading as="h1" className="text-[3rem] font-bold">
					{siteConfig.title}
				</Heading>
				<p className="text-[1.5rem] mt-4 mb-8">Modern task runner for Node.js, inspired by Gradle and powered by TypeScript</p>
				<div className="flex items-center justify-center gap-4">
					<Link className="button button--primary button--lg" to="/docs/introduction">
						Get Started
					</Link>
					<Link
						className="button button--info button--outline button--lg"
						to="https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true">
						Try it Online
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
}

type FeatureItem = {
	title: string;
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
		)
	},
	{
		title: "Smart Parallel Execution",
		description: (
			<>
				Automatically runs independent tasks in parallel while respecting dependencies. Configurable worker pools ensure optimal resource utilization.
			</>
		)
	},
	{
		title: "Modern Architecture",
		description: (
			<>
				Pure ESM package designed for modern Node.js environments. Zero legacy compatibility compromises, optimized for contemporary development
				workflows.
			</>
		)
	},
	{
		title: "Intuitive Task Management",
		description: (
			<>
				Clear and concise task definitions with explicit dependencies. Group related tasks, add descriptions, and organize your build pipeline
				effectively.
			</>
		)
	},
	{
		title: "Real-Time Progress",
		description: (
			<>
				Watch your build progress with detailed status updates, progress tracking, and performance metrics. Never wonder about what&#39;s happening
				behind the scenes.
			</>
		)
	},
	{
		title: "Extensible Plugin System",
		description: (
			<>
				Extend Nadle&#39;s capabilities with plugins. Create custom task types, add build hooks, and integrate with your favorite tools and services.
			</>
		)
	}
];

function Feature({ title, description }: FeatureItem) {
	return (
		<div className="col col--4 mb-8">
			<div className="text--center padding-horiz--md">
				<Heading as="h3" className="text-[1.5rem] font-semibold mb-4">
					{title}
				</Heading>
				<p className="text-base leading-[1.6] text-emphasis-700">{description}</p>
			</div>
		</div>
	);
}

function HomepageFeatures(): ReactNode {
	return (
		<section className="flex items-center w-full py-16 bg-emphasis-100">
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}

function CodeExample() {
	return (
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
}

export default function Home(): ReactNode {
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
}
