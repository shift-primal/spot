import type { Coordinates, DrawPayload } from "#/types";

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

export const paintSegment = (
	ctx: CanvasRenderingContext2D,
	segment: DrawPayload,
) => {
	ctx.lineWidth = segment.size;
	ctx.strokeStyle = segment.color;

	ctx.beginPath();
	ctx.moveTo(segment.from.x, segment.from.y);
	ctx.lineTo(segment.to.x, segment.to.y);
	ctx.stroke();
};
