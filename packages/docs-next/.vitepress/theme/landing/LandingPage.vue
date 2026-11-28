<script setup lang="ts">
import Hero from "./Hero.vue";
import Navbar from "./Navbar.vue";
import FinalCTA from "./FinalCTA.vue";
import ProofStrip from "./ProofStrip.vue";
import Comparison from "./Comparison.vue";
import FeatureGrid from "./FeatureGrid.vue";
import LandingFooter from "./LandingFooter.vue";
import FeaturePillars from "./FeaturePillars.vue";
</script>

<template>
	<div class="landing-root">
		<div aria-hidden="true" class="landing-bg" />
		<Navbar />
		<main class="main">
			<Hero />
			<ProofStrip />
			<Comparison />
			<FeaturePillars />
			<FeatureGrid />
			<FinalCTA />
		</main>
		<LandingFooter />
	</div>
</template>

<style scoped>
.landing-root {
	position: relative;
	overflow-x: clip;
	color: var(--landing-slate-200);
	background: var(--landing-bg);
}

.landing-bg {
	position: fixed;
	inset: 0;
	z-index: 0;
	pointer-events: none;
	background-image:
		radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.12) 1px, transparent 0),
		radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34, 211, 238, 0.08), transparent 70%);
	background-size:
		32px 32px,
		100% 100%;
	mask-image: linear-gradient(to bottom, black, black 60%, transparent);
}

.main {
	position: relative;
}
</style>
