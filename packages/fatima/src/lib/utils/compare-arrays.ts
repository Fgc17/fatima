import type { AnyType } from "@fatimajs/tools/lib";

export function compareArrays(arr1: AnyType[], arr2: AnyType[]) {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((value: AnyType, index: number) => value === arr2[index]);
}
