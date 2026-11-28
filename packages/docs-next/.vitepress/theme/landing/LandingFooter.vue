<script setup lang="ts">
import NadlePackageJson from "../../../../nadle/package.json";

const GITHUB_URL = "https://github.com/nadlejs/nadle";
const PLAYGROUND_URL =
	"https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true";

const version = NadlePackageJson.version;
const year = new Date().getFullYear();

const COLUMNS = [
	{
		title: "Docs",
		links: [
			{ label: "Introduction", href: "/docs/introduction" },
			{ label: "Installation", href: "/docs/getting-started/installation" },
			{ label: "Features", href: "/docs/getting-started/features" },
			{ label: "API Reference", href: "/docs/api/index" }
		]
	},
	{
		title: "Community",
		links: [
			{ label: "Blog", href: "/blog" },
			{ label: "Spec", href: "https://nadle.dev/spec/" },
			{ label: "Playground", href: PLAYGROUND_URL },
			{ label: "llms.txt", href: "https://nadle.dev/llms.txt" }
		]
	},
	{
		title: "GitHub",
		links: [
			{ href: GITHUB_URL, label: "Repository" },
			{ label: "Issues", href: `${GITHUB_URL}/issues` },
			{ label: "Releases", href: `${GITHUB_URL}/releases` },
			{ label: "npm", href: "https://www.npmjs.com/package/nadle" }
		]
	}
];
</script>

<template>
	<footer class="footer">
		<div class="rule" />
		<div class="inner">
			<div class="grid">
				<div>
					<h3>Nadle</h3>
					<p class="tagline">A type-safe, Gradle-inspired task runner for Node.js.</p>
					<span v-if="version" class="landing-version version">v{{ version }}</span>
				</div>
				<div v-for="column in COLUMNS" :key="column.title">
					<h4>{{ column.title }}</h4>
					<ul>
						<li v-for="link in column.links" :key="link.label">
							<a :href="link.href">{{ link.label }}</a>
						</li>
					</ul>
				</div>
			</div>
			<div class="bottom">
				<span>&copy; {{ year }} Nadle &middot; MIT License</span>
				<span>Built with <a href="https://vitepress.dev">VitePress</a></span>
			</div>
		</div>
	</footer>
</template>

<style scoped>
.footer {
	background: #08090c;
}

.rule {
	height: 1px;
	background: linear-gradient(to right, var(--landing-cyan), var(--landing-blue), var(--landing-violet));
}

.inner {
	max-width: 72rem;
	margin: 0 auto;
	padding: 3rem 1.5rem 2rem;
}

.grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 2.5rem;
}

h3 {
	margin: 0 0 0.5rem;
	color: #fff;
	font-size: 1.125rem;
	font-weight: 700;
	letter-spacing: normal;
}

.tagline {
	max-width: 20rem;
	margin: 0;
	font-size: 0.875rem;
	line-height: 1.625;
	color: var(--landing-slate-400);
}

.version {
	display: inline-block;
	margin-top: 1rem;
}

h4 {
	margin: 0 0 0.75rem;
	font-size: 0.875rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: var(--landing-slate-200);
}

ul {
	margin: 0;
	padding: 0;
	list-style: none;
}

li + li {
	margin-top: 0.5rem;
}

li a {
	font-size: 0.875rem;
	text-decoration: none;
	color: var(--landing-slate-400);
	transition: color 0.2s ease;
}

li a:hover,
.bottom a:hover {
	color: #fff;
}

.bottom {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	margin-top: 2.5rem;
	padding-top: 1.5rem;
	font-size: 0.75rem;
	color: var(--landing-slate-500);
	border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.bottom a {
	text-decoration: none;
	color: var(--landing-slate-400);
	transition: color 0.2s ease;
}

@media (min-width: 640px) {
	.bottom {
		flex-direction: row;
	}
}

@media (min-width: 768px) {
	.grid {
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 2rem;
	}
}
</style>
