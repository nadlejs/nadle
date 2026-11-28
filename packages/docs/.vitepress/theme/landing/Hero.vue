<script setup lang="ts">
import TaskGraph from "./TaskGraph.vue";
import InstallCommand from "./InstallCommand.vue";

const PLAYGROUND_URL =
	"https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true";
</script>

<template>
	<header class="hero">
		<div aria-hidden="true" class="landing-glow landing-glow-cyan glow-left" />
		<div aria-hidden="true" class="landing-glow landing-glow-violet glow-right" />
		<div class="content">
			<span class="badge">
				<span class="badge-dot" aria-hidden="true" />
				Type-safe task runner for Node.js
			</span>
			<h1>
				Sharp tasks.
				<br />
				<span class="landing-gradient-text">Fast builds.</span>
			</h1>
			<p class="lead">A type-safe, Gradle-inspired task runner. Define tasks once, let Nadle schedule, parallelize, and cache them.</p>
			<InstallCommand />
			<div class="ctas">
				<a class="landing-cta-primary" href="/docs/introduction">
					Get Started
					<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
				<a class="landing-cta-secondary" :href="PLAYGROUND_URL">
					<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
					Try Online
				</a>
			</div>
		</div>
		<div class="graph">
			<div class="graph-panel">
				<TaskGraph />
			</div>
		</div>
	</header>
</template>

<style scoped>
.hero {
	position: relative;
	overflow: hidden;
	padding: 8rem 1rem 5rem;
}

.glow-left {
	top: -10rem;
	left: 25%;
}

.glow-right {
	top: 5rem;
	right: 25%;
}

.content {
	position: relative;
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	max-width: 48rem;
	margin: 0 auto;
	text-align: center;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.25rem 0.75rem;
	font-size: 0.75rem;
	font-weight: 500;
	border-radius: 9999px;
	color: var(--landing-slate-300);
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-dot {
	width: 0.375rem;
	height: 0.375rem;
	border-radius: 9999px;
	background: var(--landing-cyan);
}

h1 {
	margin: 0;
	color: #fff;
	font-size: 3rem;
	font-weight: 800;
	line-height: 1.05;
	letter-spacing: -0.025em;
}

.lead {
	max-width: 36rem;
	margin: 0;
	font-size: 1.125rem;
	line-height: 1.625;
	color: var(--landing-slate-400);
}

.ctas {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	margin-top: 0.5rem;
}

.graph {
	position: relative;
	z-index: 10;
	max-width: 48rem;
	margin: 4rem auto 0;
}

.graph-panel {
	padding: 1.5rem;
	border-radius: 1rem;
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (min-width: 768px) {
	.hero {
		padding: 10rem 1rem 7rem;
	}

	h1 {
		font-size: 4.5rem;
	}

	.lead {
		font-size: 1.25rem;
	}

	.graph {
		margin-top: 5rem;
	}

	.graph-panel {
		padding: 2.5rem;
	}
}
</style>
