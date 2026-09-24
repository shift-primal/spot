import { clamp } from "#/lib/general";

export const clampAxis = (position: number, visible: number, world: number) =>
	visible >= world
		? (world - visible) / 2
		: clamp(position, 0, world - visible);
