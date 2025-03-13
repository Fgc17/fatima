import type { AnyType } from "lib/types";

export function debounce<T extends (...args: AnyType[]) => void>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>): void => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
}
