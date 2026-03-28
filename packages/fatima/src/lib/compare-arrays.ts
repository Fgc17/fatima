import type { Any } from "./types";

export function compareArrays(arr1: Any[], arr2: Any[]) {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((value: Any, index: number) => value === arr2[index]);
}
