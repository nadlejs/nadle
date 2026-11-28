<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const root = ref<HTMLElement | null>(null);
const visible = ref(false);
let observer: IntersectionObserver | undefined;

onMounted(() => {
	if (!root.value) {
		return;
	}

	observer = new IntersectionObserver(
		([entry]) => {
			if (entry?.isIntersecting) {
				visible.value = true;
				observer?.disconnect();
			}
		},
		{ threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
	);
	observer.observe(root.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
	<div ref="root" class="reveal" :data-reveal="visible ? 'in' : undefined">
		<slot />
	</div>
</template>

<style scoped>
.reveal {
	opacity: 0;
	transform: translateY(24px);
	transition:
		opacity 0.6s ease,
		transform 0.6s ease;
}

.reveal[data-reveal="in"] {
	opacity: 1;
	transform: none;
}

@media (prefers-reduced-motion: reduce) {
	.reveal {
		opacity: 1;
		transform: none;
		transition: none;
	}
}
</style>
