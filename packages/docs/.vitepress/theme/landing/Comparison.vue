<script setup lang="ts">
import SectionReveal from "./SectionReveal.vue";

const TOOLS = ["nadle", "npm scripts", "Turborepo", "Nx"];

const ROWS: { feature: string; values: boolean[] }[] = [
	{ feature: "Type-safe config", values: [true, false, false, false] },
	{ feature: "DAG scheduling", values: [true, false, true, true] },
	{ feature: "Built-in caching", values: [true, false, true, true] },
	{ feature: "Parallel execution", values: [true, false, true, true] },
	{ feature: "Monorepo-native", values: [true, false, true, true] }
];
</script>

<template>
	<section class="comparison">
		<SectionReveal class="reveal">
			<div class="heading">
				<h2>How Nadle <span class="landing-gradient-text">compares</span></h2>
				<p>Everything evaluators look for, without leaving TypeScript.</p>
			</div>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th class="feature-head">Feature</th>
							<th v-for="tool in TOOLS" :key="tool" :class="{ own: tool === 'nadle' }">{{ tool }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in ROWS" :key="row.feature">
							<td class="feature">{{ row.feature }}</td>
							<td v-for="(value, index) in row.values" :key="TOOLS[index]" :class="{ own: index === 0 }">
								<svg
									v-if="value"
									class="check"
									width="20"
									height="20"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									viewBox="0 0 24 24"
									aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								<svg
									v-else
									class="dash"
									width="20"
									height="20"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									viewBox="0 0 24 24"
									aria-hidden="true">
									<path stroke-linecap="round" d="M6 12h12" />
								</svg>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</SectionReveal>
	</section>
</template>

<style scoped>
.comparison {
	position: relative;
	padding: 6rem 1rem;
}

.reveal {
	max-width: 56rem;
	margin: 0 auto;
}

.heading {
	margin-bottom: 3rem;
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
	margin: 0;
	font-size: 1.125rem;
	color: var(--landing-slate-400);
}

.table-wrap {
	overflow-x: auto;
	border-radius: 1rem;
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.08);
}

table {
	display: table;
	width: 100%;
	min-width: 560px;
	margin: 0;
	font-size: 0.875rem;
	border-collapse: collapse;
}

tr {
	background: transparent;
	border: 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

thead tr {
	border-bottom-color: rgba(255, 255, 255, 0.08);
}

tbody tr:last-child {
	border-bottom: 0;
}

th,
td {
	padding: 0.875rem 1.25rem;
	text-align: center;
	border: 0;
}

th {
	font-weight: 600;
	background: transparent;
	color: var(--landing-slate-300);
}

.feature-head {
	text-align: left;
	font-weight: 500;
	color: var(--landing-slate-400);
}

.feature {
	text-align: left;
	color: var(--landing-slate-200);
}

th.own {
	color: var(--landing-cyan);
}

td.own {
	background: rgba(34, 211, 238, 0.04);
}

.check {
	color: var(--landing-emerald);
}

.dash {
	color: var(--landing-slate-600);
}

@media (min-width: 768px) {
	.comparison {
		padding: 7rem 1rem;
	}

	h2 {
		font-size: 2.25rem;
	}
}
</style>
