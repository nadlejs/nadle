<script setup lang="ts">
const CHIPS = ["ESM", "Node 22+", "Zero-config", "Worker threads"];
</script>

<template>
	<section class="strip">
		<div class="inner">
			<a href="https://github.com/nadlejs/nadle/blob/main/nadle.config.ts" class="self">
				<span class="status" aria-hidden="true" />
				Nadle builds itself
				<svg class="arrow" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			</a>
			<ul class="chips">
				<li v-for="chip in CHIPS" :key="chip">{{ chip }}</li>
			</ul>
		</div>
	</section>
</template>

<style scoped>
.strip {
	position: relative;
	padding: 2.5rem 1rem;
	background: rgba(255, 255, 255, 0.015);
	border-top: 1px solid rgba(255, 255, 255, 0.06);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.inner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	gap: 1.5rem;
	max-width: 64rem;
	margin: 0 auto;
}

.self {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	text-decoration: none;
	color: var(--landing-slate-300);
}

.self:hover {
	color: #fff;
}

.status {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 9999px;
	background: var(--landing-emerald);
}

.arrow {
	color: var(--landing-slate-500);
	transition: color 0.2s ease;
}

.self:hover .arrow {
	color: var(--landing-cyan);
}

.chips {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.625rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.chips li {
	padding: 0.375rem 0.75rem;
	font-size: 0.75rem;
	border-radius: 9999px;
	color: var(--landing-slate-400);
	font-family: var(--vp-font-family-mono);
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (min-width: 768px) {
	.inner {
		flex-direction: row;
	}
}
</style>
