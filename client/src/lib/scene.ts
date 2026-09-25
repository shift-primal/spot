import { type DrawnSegment, type Rect, TILE_SIZE } from "@spot/shared";
import type { Paint } from "#/lib/canvas";
import {
	MAX_PENDING_OWN_SEGMENTS,
	MIN_RENDER_LEVEL,
	RENDER_BUDGET_MS,
	RENDER_TILE_PX,
	TILE_MARGIN,
} from "#/lib/options";
import {
	createRenderTiles,
	levelSpan,
	type RenderTile,
	renderLevel,
	renderTileRect,
} from "#/lib/render-tiles";
import {
	createDataTiles,
	intersectRects,
	tileRange,
	WORLD_RECT,
} from "#/lib/tiles";
import type { Camera } from "#/types";

const sameSegment = (a: Paint, b: Paint) =>
	a.from.x === b.from.x &&
	a.from.y === b.from.y &&
	a.to.x === b.to.x &&
	a.to.y === b.to.y &&
	a.color === b.color &&
	a.size === b.size;

export const createScene = (requestFrame: () => void) => {
	const renderTiles = createRenderTiles();

	const dataTiles = createDataTiles({
		onLoad: (tile, changed) => {
			if (changed) renderTiles.invalidate(tile.rect);
			requestFrame();
		},
		onEvict: (tile) => renderTiles.invalidate(tile.rect),
	});

	const pendingOwn: { segment: Paint; stamp: number }[] = [];

	const paintOwn = (segment: Paint) => {
		renderTiles.paint(segment, WORLD_RECT);
		pendingOwn.push({ segment, stamp: renderTiles.latest() });
		if (pendingOwn.length > MAX_PENDING_OWN_SEGMENTS) pendingOwn.shift();
		requestFrame();
	};

	const receive = (segment: DrawnSegment) => {
		const ownIndex = pendingOwn.findIndex((own) =>
			sameSegment(own.segment, segment),
		);
		const after = ownIndex === -1 ? 0 : pendingOwn[ownIndex].stamp;
		if (ownIndex !== -1) pendingOwn.splice(0, ownIndex + 1);

		const appended = dataTiles.applySegment(segment);
		if (!appended.length) return;

		for (const tile of appended) {
			renderTiles.paint(segment, intersectRects(tile.rect, WORLD_RECT), after);
		}
		requestFrame();
	};

	const draw = (
		ctx: CanvasRenderingContext2D,
		{ x, y, zoom }: Camera,
		width: number,
		height: number,
		dpr: number,
	) => {
		const view: Rect = {
			minX: x,
			minY: y,
			maxX: x + width / zoom,
			maxY: y + height / zoom,
		};
		dataTiles.setRange(tileRange(view, TILE_SIZE, TILE_MARGIN));

		const scale = zoom * dpr;
		const blit = (tile: RenderTile, source: Rect, dest: Rect) => {
			const ratio = RENDER_TILE_PX / (tile.rect.maxX - tile.rect.minX);
			const left = Math.round((dest.minX - x) * scale);
			const top = Math.round((dest.minY - y) * scale);
			ctx.drawImage(
				tile.bitmap,
				(source.minX - tile.rect.minX) * ratio,
				(source.minY - tile.rect.minY) * ratio,
				(source.maxX - source.minX) * ratio,
				(source.maxY - source.minY) * ratio,
				left,
				top,
				Math.round((dest.maxX - x) * scale) - left,
				Math.round((dest.maxY - y) * scale) - top,
			);
		};

		const drawFallback = (level: number, rx: number, ry: number) => {
			const rect = renderTileRect(level, rx, ry);

			for (let coarser = level - 1; coarser >= MIN_RENDER_LEVEL; coarser--) {
				const span = levelSpan(coarser);
				const parent = renderTiles.peek(
					coarser,
					Math.floor(rect.minX / span),
					Math.floor(rect.minY / span),
				);
				if (!parent) continue;
				blit(parent, rect, rect);
				return;
			}

			for (let cy = 0; cy < 2; cy++) {
				for (let cx = 0; cx < 2; cx++) {
					const child = renderTiles.peek(level + 1, 2 * rx + cx, 2 * ry + cy);
					if (child) blit(child, child.rect, child.rect);
				}
			}
		};

		const level = renderLevel(zoom, dpr);
		const { x0, y0, x1, y1 } = tileRange(view, levelSpan(level), 0);
		const deadline = performance.now() + RENDER_BUDGET_MS;
		let incomplete = false;
		let pending = false;

		ctx.setTransform(1, 0, 0, 1, 0, 0);

		for (let ry = y0; ry <= y1; ry++) {
			for (let rx = x0; rx <= x1; rx++) {
				let tile = renderTiles.get(level, rx, ry);

				if (!tile) {
					const rect = renderTileRect(level, rx, ry);
					if (!dataTiles.isLoaded(rect)) {
						incomplete = true;
					} else if (performance.now() < deadline) {
						tile = renderTiles.render(
							level,
							rx,
							ry,
							dataTiles.overlapping(rect),
						);
					} else {
						incomplete = true;
						pending = true;
					}
				}

				if (tile) blit(tile, tile.rect, tile.rect);
				else drawFallback(level, rx, ry);
			}
		}

		const max = 2 * (x1 - x0 + 1) * (y1 - y0 + 1) + 16;
		renderTiles.trim(incomplete ? 2 * max : max);

		if (pending) requestFrame();
	};

	const dispose = () => {
		dataTiles.dispose();
		renderTiles.clear();
	};

	return {
		draw,
		paintOwn,
		receive,
		setConnected: dataTiles.setConnected,
		dispose,
	};
};

export type Scene = ReturnType<typeof createScene>;
