import type { Point, Segment } from "@spot/shared";

export const getPoint = (
	e: Pick<MouseEvent, "clientX" | "clientY">,
	canvas: HTMLCanvasElement,
): Point => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
	};
};

export const paintSegment = (
	ctx: CanvasRenderingContext2D,
	segment: Segment,
) => {
	const { from, to } = segment;

	if (from.x === to.x && from.y === to.y) {
		ctx.fillStyle = segment.color;
		ctx.beginPath();
		ctx.arc(from.x, from.y, segment.size / 2, 0, Math.PI * 2);
		ctx.fill();
		return;
	}

	ctx.lineWidth = segment.size;
	ctx.strokeStyle = segment.color;

	ctx.beginPath();
	ctx.moveTo(segment.from.x, segment.from.y);
	ctx.lineTo(segment.to.x, segment.to.y);
	ctx.stroke();
};

const compressPoint = (p: Point) => ({
	x: Math.round(p.x),
	y: Math.round(p.y),
});

export const compressSegment = (s: Segment): Segment => ({
	...s,
	from: compressPoint(s.from),
	to: compressPoint(s.to),
});
