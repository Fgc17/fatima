import * as icons from "@heroicons/react/16/solid";
import { createElement } from "react";

export function Icon({
	icon,
	className,
}: {
	icon: string | undefined;
	className?: string;
}) {
	if (!icon) {
		return;
	}

	if (!icon.endsWith("Icon")) {
		icon = `${icon}Icon`;
	}

	if (icon && !(icon in icons)) {
		console.log(`Icon not found: ${icon}`);

		return;
	}

	if (icon in icons)
		return createElement(icons[icon as keyof typeof icons], {
			className,
		});
}
