import "./custom.css";

import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import LandingPage from "./landing/LandingPage.vue";

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component("LandingPage", LandingPage);
	}
} satisfies Theme;
