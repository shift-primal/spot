import type { Point, Rect, TileStroke } from "@spot/shared";

export type Ctx2D =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

export interface Paint {
	from: Point;
	to: Point;
	color: string;
	size: number;
}

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

const paintDot = (
	ctx: Ctx2D,
	x: number,
	y: number,
	color: string,
	size: number,
) => {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, size / 2, 0, Math.PI * 2);
	ctx.fill();
};

export const paintSegment = (ctx: Ctx2D, { from, to, color, size }: Paint) => {
	if (from.x === to.x && from.y === to.y) {
		paintDot(ctx, from.x, from.y, color, size);
		return;
	}

	ctx.lineWidth = size;
	ctx.strokeStyle = color;

	ctx.beginPath();
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	ctx.stroke();
};

export const paintStroke = (
	ctx: Ctx2D,
	{ points, color, size }: TileStroke,
) => {
	if (points.length === 2) {
		paintDot(ctx, points[0], points[1], color, size);
		return;
	}

	ctx.lineWidth = size;
	ctx.strokeStyle = color;

	ctx.beginPath();
	ctx.moveTo(points[0], points[1]);
	for (let i = 2; i < points.length; i += 2) {
		ctx.lineTo(points[i], points[i + 1]);
	}
	ctx.stroke();
};

export const clipTo = (ctx: Ctx2D, { minX, minY, maxX, maxY }: Rect) => {
	ctx.beginPath();
	ctx.rect(minX, minY, maxX - minX, maxY - minY);
	ctx.clip();
};
