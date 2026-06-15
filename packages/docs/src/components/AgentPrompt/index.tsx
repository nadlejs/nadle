import React, { useRef, useState } from "react";

import styles from "./styles.module.css";

interface AgentPromptProps {
	/** The prompt text. Provided as children so it reads naturally in MDX. */
	readonly children: React.ReactNode;
}

export default function AgentPrompt({ children }: AgentPromptProps): React.ReactElement {
	const bodyRef = useRef<HTMLParagraphElement>(null);
	const [copied, setCopied] = useState(false);

	async function handleCopy(): Promise<void> {
		const text = bodyRef.current?.textContent?.trim() ?? "";

		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div className={styles.block}>
			<div className={styles.header}>
				<span className={styles.label}>Prompt for your AI agent</span>
				<button type="button" className={styles.copy} onClick={handleCopy}>
					📋 {copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<p ref={bodyRef} className={styles.body}>
				{children}
			</p>
		</div>
	);
}
