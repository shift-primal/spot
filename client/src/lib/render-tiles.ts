import { type Rect, rectsOverlap, TILE_SIZE } from "@spot/shared";
import {
	type Ctx2D,
	clipTo,
	type Paint,
	paintSegment,
	paintStroke,
} from "#/lib/canvas";
import { clamp } from "#/lib/general";
import {
	CAMERA_ZOOM_BOUNDS,
	MIN_RENDER_LEVEL,
	RENDER_TILE_PX,
} from "#/lib/options";
import { type DataTile, intersectRects, WORLD_RECT } from "#/lib/tiles";

export interface RenderTile {
	rect: Rect;
	stamp: number;
	bitmap: OffscreenCanvas | HTMLCanvasElement;
	ctx: Ctx2D;
}

export const levelSpan = (level: number) => TILE_SIZE / 2 ** level;

export const renderLevel = (zoom: number, dpr: number) =>
	clamp(
		Math.ceil(Math.log2(zoom * dpr)),
		MIN_RENDER_LEVEL,
		Math.ceil(Math.log2(CAMERA_ZOOM_BOUNDS.max * dpr)),
	);

export const renderTileRect = (level: number, rx: number, ry: number) => {
	const span = levelSpan(level);
	return {
		minX: rx * span,
		minY: ry * span,
		maxX: (rx + 1) * span,
		maxY: (ry + 1) * span,
	};
};

const createBitmap = () => {
	if (typeof OffscreenCanvas !== "undefined") {
		const bitmap = new OffscreenCanvas(RENDER_TILE_PX, RENDER_TILE_PX);
		const ctx = bitmap.getContext("2d");
		if (ctx) return { bitmap, ctx };
	}

	const bitmap = document.createElement("canvas");
	bitmap.width = RENDER_TILE_PX;
	bitmap.height = RENDER_TILE_PX;
	const ctx = bitmap.getContext("2d");
	if (!ctx) throw new Error("2d canvas context unavailable");
	return { bitmap, ctx };
};

const toWorld = ({ rect, ctx }: RenderTile) => {
	const scale = RENDER_TILE_PX / (rect.maxX - rect.minX);
	ctx.setTransform(scale, 0, 0, scale, -rect.minX * scale, -rect.minY * scale);
};

const isEmpty = ({ minX, minY, maxX, maxY }: Rect) =>
	minX >= maxX || minY >= maxY;

const segmentBounds = ({ from, to, size }: Paint): Rect => ({
	minX: Math.min(from.x, to.x) - size / 2,
	minY: Math.min(from.y, to.y) - size / 2,
	maxX: Math.max(from.x, to.x) + size / 2,
	maxY: Math.max(from.y, to.y) + size / 2,
});

export const createRenderTiles = () => {
	const cache = new Map<string, RenderTile>();
	let stamp = 0;

	const key = (level: number, rx: number, ry: number) => `${level}:${rx}:${ry}`;

	const get = (level: number, rx: number, ry: number) => {
		const k = key(level, rx, ry);
		const tile = cache.get(k);
		if (!tile) return null;
		cache.delete(k);
		cache.set(k, tile);
		return tile;
	};

	const peek = (level: number, rx: number, ry: number) =>
		cache.get(key(level, rx, ry)) ?? null;

	const render = (
		level: number,
		rx: number,
		ry: number,
		dataTiles: DataTile[],
	) => {
		const tile: RenderTile = {
			rect: renderTileRect(level, rx, ry),
			stamp: ++stamp,
			...createBitmap(),
		};
		const { ctx } = tile;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		toWorld(tile);

		for (const data of dataTiles) {
			if (!data.strokes) continue;
			ctx.save();
			clipTo(ctx, intersectRects(data.rect, WORLD_RECT));
			for (const stroke of data.strokes) {
				if (rectsOverlap(stroke.bounds, tile.rect)) paintStroke(ctx, stroke);
			}
			ctx.restore();
		}

		cache.set(key(level, rx, ry), tile);
		return tile;
	};

	const paint = (segment: Paint, clip: Rect, after = 0) => {
		const area = intersectRects(segmentBounds(segment), clip);
		if (isEmpty(area)) return;

		for (const tile of cache.values()) {
			if (tile.stamp <= after || !rectsOverlap(tile.rect, area)) continue;
			toWorld(tile);
			tile.ctx.save();
			clipTo(tile.ctx, clip);
			paintSegment(tile.ctx, segment);
			tile.ctx.restore();
		}
	};

	const invalidate = (rect: Rect) => {
		for (const [k, tile] of cache) {
			if (rectsOverlap(tile.rect, rect)) cache.delete(k);
		}
	};

	const trim = (max: number) => {
		for (const k of cache.keys()) {
			if (cache.size <= max) return;
			cache.delete(k);
		}
	};

	const clear = () => cache.clear();

	const latest = () => stamp;

	return { get, peek, render, paint, invalidate, trim, clear, latest };
};

export type RenderTiles = ReturnType<typeof createRenderTiles>;
