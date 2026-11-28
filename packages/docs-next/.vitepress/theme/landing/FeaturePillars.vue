<script setup lang="ts">
import CodeWindow from "./CodeWindow.vue";
import TerminalBlock from "./TerminalBlock.vue";
import SectionReveal from "./SectionReveal.vue";

const typeSafetyCode = `import { tasks, defineTask } from "nadle";

interface DeployOptions {
  target: "staging" | "production";
  dryRun: boolean;
}

const DeployTask = defineTask<DeployOptions>({
  run: async ({ options, context }) => {
    context.logger.info(\`Deploying to \${options.target}\`);
  }
});

tasks.register("deploy", {
  run: DeployTask,
  options: { target: "staging", dryRun: true }
});`;

const cachingCode = `tasks.register("compile", {
  run: ExecTask,
  options: { command: "tsc", args: ["--build"] },
  inputs: [Inputs.files("src/**/*.ts", "tsconfig.json")],
  outputs: [Outputs.dirs("lib")]
});
// Unchanged inputs? Task is skipped automatically.`;

const parallelTerminal = `$ nadle build

  ● lint        running
  ● compile     running
  ○ test        waiting → compile
  ○ bundle      waiting → compile

  ✓ lint        done  1.2s
  ✓ compile     done  3.4s
  ● test        running
  ● bundle      running`;
</script>

<template>
	<section class="pillars">
		<div class="inner">
			<SectionReveal class="heading">
				<h2>Built for <span class="landing-gradient-text">developer experience</span></h2>
				<p>Three pillars that set Nadle apart from every other task runner.</p>
			</SectionReveal>
			<div class="list">
				<SectionReveal>
					<div class="pillar">
						<div>
							<span class="badge">Type Safety</span>
							<h3>Catch errors before they happen</h3>
							<p>
								Define custom task types with generics. Full IntelliSense for task options, configuration errors caught at compile time. TypeScript is
								the foundation, not an afterthought.
							</p>
						</div>
						<div class="media">
							<div aria-hidden="true" class="landing-glow landing-glow-blue glow" />
							<div class="media-body"><CodeWindow title="deploy.ts" :code="typeSafetyCode" /></div>
						</div>
					</div>
				</SectionReveal>
				<SectionReveal>
					<div class="pillar">
						<div class="reverse-text">
							<span class="badge">Parallelism</span>
							<h3>Maximum throughput, zero wasted time</h3>
							<p>
								Nadle builds a dependency graph and runs independent tasks in parallel across worker threads. Watch your pipeline light up as
								dependencies resolve.
							</p>
						</div>
						<div class="media reverse-media">
							<div aria-hidden="true" class="landing-glow landing-glow-blue glow" />
							<div class="media-body"><TerminalBlock :content="parallelTerminal" /></div>
						</div>
					</div>
				</SectionReveal>
				<SectionReveal>
					<div class="pillar">
						<div>
							<span class="badge">Caching</span>
							<h3>Only rebuild what changed</h3>
							<p>
								Declare inputs and outputs for any task. Nadle fingerprints them and skips work when nothing changed. Fast incremental builds out of
								the box.
							</p>
						</div>
						<div class="media">
							<div aria-hidden="true" class="landing-glow landing-glow-blue glow" />
							<div class="media-body"><CodeWindow title="nadle.config.ts" :code="cachingCode" /></div>
						</div>
					</div>
				</SectionReveal>
			</div>
		</div>
	</section>
</template>

<style scoped>
.pillars {
	position: relative;
	padding: 6rem 1rem;
}

.inner {
	max-width: 64rem;
	margin: 0 auto;
}

.heading {
	margin-bottom: 5rem;
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
	max-width: 42rem;
	margin: 0 auto;
	font-size: 1.125rem;
	color: var(--landing-slate-400);
}

.list {
	display: flex;
	flex-direction: column;
	gap: 6rem;
}

.pillar {
	display: grid;
	grid-template-columns: 1fr;
	align-items: center;
	gap: 2.5rem;
}

.badge {
	display: inline-block;
	margin-bottom: 1.25rem;
	padding: 0.25rem 0.75rem;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	border-radius: 9999px;
	color: #67e8f9;
	background: rgba(34, 211, 238, 0.1);
	border: 1px solid rgba(34, 211, 238, 0.2);
}

h3 {
	margin: 0 0 1rem;
	color: #fff;
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.33;
	letter-spacing: normal;
}

.pillar p {
	margin: 0;
	font-size: 1.125rem;
	line-height: 1.625;
	color: var(--landing-slate-400);
}

.media {
	position: relative;
	min-width: 0;
}

.glow {
	inset: 0;
	margin: auto;
}

.media-body {
	position: relative;
	z-index: 10;
}

@media (min-width: 768px) {
	.pillars {
		padding: 8rem 1rem;
	}

	h2 {
		font-size: 2.25rem;
	}

	.list {
		gap: 8rem;
	}

	.pillar {
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
	}

	.reverse-text {
		order: 2;
	}

	.reverse-media {
		order: 1;
	}

	h3 {
		font-size: 1.875rem;
	}
}
</style>
