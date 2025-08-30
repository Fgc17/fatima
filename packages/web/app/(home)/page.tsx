import { ArrowUpRightIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { FatimaLogo } from "../../components/logo";

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<FatimaLogo className="mx-auto mb-1 size-10" />
			<h1 className="mb-1 text-2xl font-bold">fatima</h1>
			<p className="text-fd-muted-foreground">
				safe secrets for the javascript ecosystem
			</p>
			<p className="mt-8">
				<Link
					href="/docs/"
					className="text-fd-foreground font-semibold   border-white"
				>
					Get started <ArrowUpRightIcon className="size-4 inline" />
				</Link>{" "}
			</p>
		</main>
	);
}
