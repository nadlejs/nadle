<script setup lang="ts">
import SectionReveal from "./SectionReveal.vue";
import InstallCommand from "./InstallCommand.vue";
</script>

<template>
	<section class="cta">
		<SectionReveal class="reveal">
			<div class="panel">
				<div aria-hidden="true" class="landing-glow landing-glow-violet glow-top" />
				<div aria-hidden="true" class="landing-glow landing-glow-cyan glow-bottom" />
				<div class="content">
					<h2>Ready to get started?</h2>
					<p>Install Nadle and run your first task in under two minutes.</p>
					<InstallCommand />
					<a class="landing-cta-primary" href="/docs/introduction">
						Get Started
						<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</a>
				</div>
			</div>
		</SectionReveal>
	</section>
</template>

<style scoped>
.cta {
	position: relative;
	padding: 6rem 1rem;
}

.reveal {
	max-width: 48rem;
	margin: 0 auto;
}

.panel {
	position: relative;
	overflow: hidden;
	padding: 4rem 1.5rem;
	text-align: center;
	border-radius: 1.5rem;
	background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.12), transparent 60%), rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(148, 163, 184, 0.12);
}

.glow-top {
	top: -6rem;
	right: 0;
}

.glow-bottom {
	bottom: -6rem;
	left: 0;
}

.content {
	position: relative;
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
}

h2 {
	margin: 0;
	padding: 0;
	border: 0;
	color: #fff;
	font-size: 1.875rem;
	font-weight: 700;
	line-height: 1.25;
	letter-spacing: normal;
}

.content p {
	max-width: 28rem;
	margin: 0;
	font-size: 1.125rem;
	color: var(--landing-slate-300);
}

@media (min-width: 768px) {
	.cta {
		padding: 8rem 1rem;
	}

	.panel {
		padding: 5rem 3rem;
	}

	h2 {
		font-size: 3rem;
		line-height: 1;
	}
}
</style>
