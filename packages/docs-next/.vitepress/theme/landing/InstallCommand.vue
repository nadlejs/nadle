<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";

const INSTALL_COMMAND = "npm install -D nadle";
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function copy(): void {
	void navigator.clipboard.writeText(INSTALL_COMMAND);
	copied.value = true;
	clearTimeout(timer);
	timer = setTimeout(() => (copied.value = false), 2000);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
	<button type="button" class="install" :aria-label="`Copy install command: ${INSTALL_COMMAND}`" @click="copy">
		<span class="prompt">$</span>
		<span class="command">{{ INSTALL_COMMAND }}</span>
		<span v-if="!copied" class="icon idle">
			<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<rect x="9" y="9" width="13" height="13" rx="2" />
				<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
			</svg>
		</span>
		<span v-else class="icon done">
			<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</span>
	</button>
</template>

<style scoped>
.install {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1.25rem;
	font-size: 0.875rem;
	cursor: pointer;
	border-radius: 0.5rem;
	font-family: var(--vp-font-family-mono);
	background: rgba(255, 255, 255, 0.04);
	border: 1px solid rgba(255, 255, 255, 0.1);
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease;
}

.install:hover {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(34, 211, 238, 0.3);
}

.prompt {
	color: var(--landing-cyan);
}

.command {
	color: var(--landing-slate-200);
}

.icon {
	display: inline-flex;
	margin-left: 0.25rem;
}

.idle {
	color: var(--landing-slate-500);
	transition: color 0.2s ease;
}

.install:hover .idle {
	color: var(--landing-slate-300);
}

.done {
	color: var(--landing-emerald);
}
</style>
