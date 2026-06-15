import React, { useState } from "react";
import { useLocation } from "@docusaurus/router";

import styles from "./styles.module.css";

type Status = "idle" | "copied" | "linked";

export default function CopyPageButton(): React.ReactElement {
	const { pathname } = useLocation();
	const [status, setStatus] = useState<Status>("idle");

	async function handleCopy(): Promise<void> {
		const mdUrl = pathname.replace(/\/$/, "") + ".md";

		try {
			const response = await fetch(mdUrl);

			if (!response.ok) {
				throw new Error(`status ${response.status}`);
			}

			const markdown = await response.text();

			await navigator.clipboard.writeText(markdown);
			setStatus("copied");
		} catch {
			// Fallback: copy the page URL so the agent can fetch it itself.
			await navigator.clipboard.writeText(window.location.href);
			setStatus("linked");
		}

		setTimeout(() => setStatus("idle"), 2000);
	}

	const label = status === "copied" ? "Copied!" : status === "linked" ? "Link copied" : "Copy page";

	return (
		<button
			type="button"
			className={status === "idle" ? styles.button : `${styles.button} ${styles.copied}`}
			onClick={handleCopy}
			title="Copy this page as Markdown for an AI agent"
		>
			📋 {label}
		</button>
	);
}
