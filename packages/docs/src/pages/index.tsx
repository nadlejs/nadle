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
				<p className="hero__subtitle">{siteConfig.tagline}</p>
				<div className={styles.buttons}>
					<Link className="button button--secondary button--lg" to="/docs/introduction">
						Get Started with Nadle
					</Link>
				</div>
			</div>
		</header>
	);
}

export default function Home(): ReactNode {
	const { siteConfig } = useDocusaurusContext();

	return (
		<Layout title={`${siteConfig.title} - ${siteConfig.tagline}`} description="A modern, type-safe task runner for Node.js inspired by Gradle">
			<HomepageHeader />
			<main>
				<div className="container margin-vert--xl">
					<div className="row">
						<div className="col col--6">
							<div className="text--center padding-horiz--md">
								<h2>Type-Safe Task Runner</h2>
								<p>Built from the ground up with TypeScript, providing complete type inference and compile-time checks for your build tasks.</p>
							</div>
						</div>
						<div className="col col--6">
							<div className="text--center padding-horiz--md">
								<h2>Modern Architecture</h2>
								<p>Pure ESM package designed for modern Node.js environments with parallel execution and smart dependency management.</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</Layout>
	);
}
