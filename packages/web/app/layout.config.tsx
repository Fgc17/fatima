import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { FatimaLogo } from "../components/logo";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	githubUrl: "https://github.com/Fgc17/fatima",
	nav: {
		title: (
			<>
				<FatimaLogo />
				fatima
			</>
		),
	},
};
