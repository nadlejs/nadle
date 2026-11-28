<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
	<div class="chrome">
		<span class="dot red" />
		<span class="dot yellow" />
		<span class="dot green" />
		<span class="title">{{ title }}</span>
	</div>
</template>

<style scoped>
.chrome {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	background: rgba(255, 255, 255, 0.04);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dot {
	width: 0.75rem;
	height: 0.75rem;
	border-radius: 9999px;
}

.red {
	background: #ff5f57;
}

.yellow {
	background: #febc2e;
}

.green {
	background: #28c840;
}

.title {
	margin-left: 0.5rem;
	font-size: 0.75rem;
	color: var(--landing-slate-400);
	font-family: var(--vp-font-family-mono);
}
</style>
