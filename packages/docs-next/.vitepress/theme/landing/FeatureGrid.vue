<script setup lang="ts">
import SectionReveal from "./SectionReveal.vue";
</script>

<template>
	<section class="grid-section">
		<div class="inner">
			<SectionReveal class="heading">
				<h2>Everything you need</h2>
				<p>Batteries included, no bloat. Every feature earns its place.</p>
			</SectionReveal>
			<SectionReveal>
				<div class="grid">
					<div class="card">
						<div aria-hidden="true" class="card-glow" />
						<div class="card-body">
							<div class="icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<rect x="3" y="4" width="18" height="16" rx="2" />
									<path d="M7 12l3 3-3 3" stroke-linecap="round" stroke-linejoin="round" />
									<path d="M13 18h4" stroke-linecap="round" />
								</svg>
							</div>
							<h3>Smart CLI</h3>
							<p>Abbreviation matching, autocorrection, dry run, and summary mode. Run tasks with minimal typing.</p>
						</div>
					</div>
					<div class="card">
						<div aria-hidden="true" class="card-glow" />
						<div class="card-body">
							<div class="icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<circle cx="12" cy="12" r="9" />
									<path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<h3>Real-time progress</h3>
							<p>Interactive footer shows scheduled, running, and completed tasks live as they execute.</p>
						</div>
					</div>
					<div class="card">
						<div aria-hidden="true" class="card-glow" />
						<div class="card-body">
							<div class="icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<rect x="3" y="3" width="7" height="7" rx="1.5" />
									<rect x="14" y="3" width="7" height="7" rx="1.5" />
									<rect x="8.5" y="14" width="7" height="7" rx="1.5" />
									<path d="M6.5 10v2.5a1 1 0 001 1H12m5.5-3.5v2.5a1 1 0 01-1 1H12m0 0v1.5" stroke-linecap="round" />
								</svg>
							</div>
							<h3>Monorepo-native</h3>
							<p>First-class workspace support. Run tasks across packages with full dependency awareness.</p>
						</div>
					</div>
					<div class="card">
						<div aria-hidden="true" class="card-glow" />
						<div class="card-body">
							<div class="icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path
										d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
										stroke-linecap="round"
										stroke-linejoin="round" />
								</svg>
							</div>
							<h3>Built-in tasks</h3>
							<p>ExecTask, PnpmTask, CopyTask, DeleteTask. Common operations ready out of the box.</p>
						</div>
					</div>
					<div class="card">
						<div aria-hidden="true" class="card-glow" />
						<div class="card-body">
							<div class="icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<h3>Modern architecture</h3>
							<p>Pure ESM, Node.js 22+, worker-thread isolation. Zero legacy compromises.</p>
						</div>
					</div>
					<div class="card">
						<div aria-hidden="true" class="card-glow" />
						<div class="card-body">
							<div class="icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<rect x="4" y="6" width="16" height="12" rx="2" />
									<path d="M9 11h6M9 14h3" stroke-linecap="round" />
									<path d="M12 2v4M8 22h8" stroke-linecap="round" />
								</svg>
							</div>
							<h3>Agent-ready</h3>
							<p>Ships llms.txt and llms-full.txt so AI agents can discover and reason about your tasks.</p>
						</div>
					</div>
				</div>
			</SectionReveal>
		</div>
	</section>
</template>

<style scoped>
.grid-section {
	position: relative;
	padding: 6rem 1rem;
	background: rgba(255, 255, 255, 0.015);
	border-top: 1px solid rgba(255, 255, 255, 0.06);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.inner {
	max-width: 64rem;
	margin: 0 auto;
}

.heading {
	margin-bottom: 4rem;
	text-align: center;
}

h2 {
	margin: 0 0 0.75rem;
	padding: 0;
	border: 0;
	color: #fff;
	font-size: 1.875rem;
	font-weight: 700;
	line-height: 1.25;
	letter-spacing: normal;
}

.heading p {
	max-width: 32rem;
	margin: 0 auto;
	font-size: 1.125rem;
	color: var(--landing-slate-400);
}

.grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 1.25rem;
}

.card {
	position: relative;
	overflow: hidden;
	padding: 1.75rem;
	border-radius: 1rem;
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(148, 163, 184, 0.1);
	transition:
		border-color 0.3s ease,
		transform 0.3s ease;
}

.card:hover {
	transform: translateY(-2px);
	border-color: rgba(34, 211, 238, 0.3);
}

.card-glow {
	position: absolute;
	inset: 0;
	border-radius: 1rem;
	opacity: 0;
	pointer-events: none;
	background: radial-gradient(ellipse at top, rgba(34, 211, 238, 0.1), transparent 60%);
	transition: opacity 0.3s ease;
}

.card:hover .card-glow {
	opacity: 1;
}

.card-body {
	position: relative;
	z-index: 10;
}

.icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.75rem;
	height: 2.75rem;
	margin-bottom: 1.25rem;
	border-radius: 0.75rem;
	color: var(--landing-cyan);
	background: rgba(255, 255, 255, 0.05);
}

h3 {
	margin: 0 0 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.5;
	letter-spacing: normal;
	color: var(--landing-slate-100);
}

.card p {
	margin: 0;
	font-size: 0.875rem;
	line-height: 1.625;
	color: var(--landing-slate-400);
}

@media (min-width: 640px) {
	.grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (min-width: 768px) {
	.grid-section {
		padding: 8rem 1rem;
	}

	h2 {
		font-size: 2.25rem;
	}
}

@media (min-width: 1024px) {
	.grid {
		grid-template-columns: repeat(3, 1fr);
	}
}
</style>
