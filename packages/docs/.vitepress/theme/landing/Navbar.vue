<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

import NadlePackageJson from "../../../../nadle/package.json";

const GITHUB_URL = "https://github.com/nadlejs/nadle";
const version = NadlePackageJson.version;
const NAV_LINKS = [
	{ label: "Docs", href: "/docs/introduction" },
	{ label: "Spec", href: "https://nadle.dev/spec/" },
	{ label: "Blog", href: "/blog" }
];

const scrolled = ref(false);
const onScroll = (): void => {
	scrolled.value = window.scrollY > 8;
};

onMounted(() => {
	onScroll();
	window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
	<nav class="nav" :data-scrolled="scrolled ? '' : undefined">
		<div class="inner">
			<a href="/" class="brand">
				<img src="/img/logo.svg" alt="" aria-hidden="true" width="26" height="26" />
				<span>Nadle</span>
			</a>
			<div class="actions">
				<a v-for="link in NAV_LINKS" :key="link.label" :href="link.href" class="link">{{ link.label }}</a>
				<a v-if="version" :href="`${GITHUB_URL}/releases/tag/v${version}`" class="landing-version">v{{ version }}</a>
				<a :href="GITHUB_URL" aria-label="GitHub repository" class="github">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
					</svg>
				</a>
			</div>
		</div>
	</nav>
</template>

<style scoped>
.nav {
	position: fixed;
	inset: 0 0 auto;
	z-index: 50;
	border-bottom: 1px solid transparent;
	transition:
		background-color 0.25s ease,
		border-color 0.25s ease,
		backdrop-filter 0.25s ease;
}

.nav[data-scrolled] {
	background: rgba(8, 9, 12, 0.72);
	backdrop-filter: saturate(160%) blur(12px);
	border-bottom-color: rgba(148, 163, 184, 0.1);
}

.inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 4rem;
	max-width: 72rem;
	margin: 0 auto;
	padding: 0 1rem;
}

.brand {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	color: #fff;
	font-size: 1.125rem;
	font-weight: 700;
	letter-spacing: -0.025em;
	text-decoration: none;
}

.actions {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.link {
	display: none;
	padding: 0.5rem 0.75rem;
	font-size: 0.875rem;
	border-radius: 0.375rem;
	text-decoration: none;
	color: var(--landing-slate-300);
	transition: color 0.2s ease;
}

.link:hover {
	color: #fff;
}

.github {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 0.375rem;
	color: var(--landing-slate-300);
	transition:
		color 0.2s ease,
		background-color 0.2s ease;
}

.github:hover {
	color: #fff;
	background: rgba(255, 255, 255, 0.06);
}

@media (min-width: 640px) {
	.inner {
		padding: 0 1.5rem;
	}

	.actions {
		gap: 0.5rem;
	}

	.link {
		display: inline-flex;
	}
}
</style>
