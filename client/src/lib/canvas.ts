import type { Coordinates } from "#/types";

export const getCoords = (
	e: React.MouseEvent,
	canvas: HTMLCanvasElement,
): Coordinates => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
	};
};
