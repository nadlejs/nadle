import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import type { ReactNode } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import styles from "./index.module.css";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className={clsx("hero hero--primary", styles.heroBanner)}>
			<div className="container">
				<Heading as="h1" className="hero__title">
					{siteConfig.title}
				</Heading>
				<p className="hero__subtitle">Modern task runner for Node.js, inspired by Gradle and powered by TypeScript</p>
				<div className={styles.buttons}>
					<Link className="button button--primary button--lg" to="/docs/introduction">
						Get Started
					</Link>
					<Link
						className="button button--info button--outline button--lg"
						to="https://codesandbox.io/p/sandbox/github/nam-hle/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true">
						Try it Online
					</Link>
					<span className={styles.indexCtasGitHubButtonWrapper}>
						<iframe
							className={styles.indexCtasGitHubButton}
							src="https://ghbtns.com/github-btn.html?user=nam-hle&amp;repo=nadle&amp;type=star&amp;count=true&amp;size=large"
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
				Watch your build progress with detailed status updates, progress tracking, and performance metrics. Never wonder about what's happening behind
				the scenes.
			</>
		)
	},
	{
		title: "Extensible Plugin System",
		description: (
			<>Extend Nadle's capabilities with plugins. Create custom task types, add build hooks, and integrate with your favorite tools and services.</>
		)
	}
];

function Feature({ title, description }: FeatureItem) {
	return (
		<div className={clsx("col col--4", styles.feature)}>
			<div className="text--center padding-horiz--md">
				<Heading as="h3">{title}</Heading>
				<p>{description}</p>
			</div>
		</div>
	);
}

function HomepageFeatures(): ReactNode {
	return (
		<section className={styles.features}>
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
		<div className={styles.codeExample}>
			<div className="container">
				<div className="row">
					<div className="col col--6">
						<Heading as="h2">Simple Yet Powerful</Heading>
						<p>Define tasks with clear dependencies and run them with a single command. Nadle handles the rest.</p>
					</div>
					<div className="col col--6">
						<pre className={styles.codeBlock}>
							<code>
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
