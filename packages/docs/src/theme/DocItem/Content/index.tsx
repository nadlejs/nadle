import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";

import CopyPageButton from "../../../components/CopyPageButton";

import styles from "./styles.module.css";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactElement {
	return (
		<>
			<div className={styles.actions}>
				<CopyPageButton />
			</div>
			<Content {...props} />
		</>
	);
}
