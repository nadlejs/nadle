<script setup lang="ts">
import { tokenizeLine } from "./highlight";
import WindowChrome from "./WindowChrome.vue";

const props = defineProps<{ code: string; title: string }>();

const lines = props.code.split("\n").map(tokenizeLine);
</script>

<template>
	<div class="window">
		<WindowChrome :title="title" />
		<pre
			class="code"><div v-for="(line, index) in lines" :key="index" class="line"><span v-for="(token, tokenIndex) in line" :key="tokenIndex" :class="token.kind">{{ token.text }}</span></div></pre>
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

.code {
	margin: 0;
	padding: 1.25rem 1.5rem;
	overflow-x: auto;
	font-size: 0.86rem;
	line-height: 1.7;
	color: #d4d4d4;
	font-family: var(--vp-font-family-mono);
}

.line {
	min-height: 1.7em;
}

.keyword {
	color: #569cd6;
}

.string {
	color: #ce9178;
}

.comment {
	color: #6a9955;
}
</style>
