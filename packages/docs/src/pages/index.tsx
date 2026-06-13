import type { FC } from "react";
import Layout from "@theme/Layout";

import Hero from "../components/landing/Hero";
import Navbar from "../components/landing/Navbar";
import FinalCTA from "../components/landing/FinalCTA";
import ProofStrip from "../components/landing/ProofStrip";
import Comparison from "../components/landing/Comparison";
import FeatureGrid from "../components/landing/FeatureGrid";
import FeaturePillars from "../components/landing/FeaturePillars";

const HomePage: FC = () => (
	<Layout title="Sharp tasks. Fast builds." description="A type-safe, Gradle-inspired task runner for Node.js. Sharp tasks. Fast builds.">
		<div className="landing-root">
			<div aria-hidden className="landing-bg" />
			<Navbar />
			<main className="relative">
				<Hero />
				<ProofStrip />
				<Comparison />
				<FeaturePillars />
				<FeatureGrid />
				<FinalCTA />
			</main>
		</div>
	</Layout>
);

export default HomePage;
