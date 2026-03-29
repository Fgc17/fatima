import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";

const inter = Inter({
	subsets: ["latin"],
});

export const metadata = createMetadata({
	title: {
		template: "%s | Fatima",
		default: "Fatima",
	},
	description: "safe secrets for the javascript ecosystem",
	icons: {
		icon: [
			{
				media: "(prefers-color-scheme: light)",
				url: "/favicon/light.svg",
				href: "/favicon/light.svg",
			},
			{
				media: "(prefers-color-scheme: dark)",
				url: "/favicon/dark.svg",
				href: "/favicon/dark.svg",
			},
		],
	},
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
