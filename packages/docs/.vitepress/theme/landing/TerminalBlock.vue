<script setup lang="ts">
import WindowChrome from "./WindowChrome.vue";

withDefaults(defineProps<{ title?: string; content: string }>(), { title: "Terminal" });
</script>

<template>
	<div class="window">
		<WindowChrome :title="title" />
		<pre class="terminal">{{ content }}</pre>
	</div>
</template>

<style scoped>
.window {
	position: relative;
	overflow: hidden;
	border-radius: 0.75rem;
	border: 1px solid rgba(255, 255, 255, 0.08);
	background: #0b0d12;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.terminal {
	margin: 0;
	padding: 1.25rem;
	overflow-x: auto;
	font-size: 0.875rem;
	line-height: 1.625;
	color: var(--landing-slate-300);
	font-family: var(--vp-font-family-mono);
}
</style>
