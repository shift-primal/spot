import {
	type DrawnSegment,
	type Rect,
	TILE_SIZE,
	type TileBody,
	type TileStroke,
	tileKey,
	tileRect,
	tilesForSegment,
	WORLD_SIZE,
} from "@spot/shared";
import { clamp } from "#/lib/general";
import { TILE_RETRY_MS } from "#/lib/options";

export interface ClientStroke extends TileStroke {
	bounds: Rect;
}

export interface DataTile {
	tx: number;
	ty: number;
	rect: Rect;
	status: "loading" | "loaded";
	strokes: ClientStroke[] | null;
	loadedSeq: number;
	etag: string | null;
	held: DrawnSegment[];
	controller: AbortController | null;
	retry: ReturnType<typeof setTimeout> | null;
}

export interface TileRange {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}

export const WORLD_RECT: Rect = {
	minX: 0,
	minY: 0,
	maxX: WORLD_SIZE.width,
	maxY: WORLD_SIZE.height,
};

export const intersectRects = (a: Rect, b: Rect): Rect => ({
	minX: Math.max(a.minX, b.minX),
	minY: Math.max(a.minY, b.minY),
	maxX: Math.min(a.maxX, b.maxX),
	maxY: Math.min(a.maxY, b.maxY),
});

export const tileRange = (view: Rect, span: number, margin: number) => {
	const last = Math.ceil(WORLD_SIZE.width / span) - 1;
	return {
		x0: clamp(Math.floor(view.minX / span) - margin, 0, last),
		y0: clamp(Math.floor(view.minY / span) - margin, 0, last),
		x1: clamp(Math.ceil(view.maxX / span) - 1 + margin, 0, last),
		y1: clamp(Math.ceil(view.maxY / span) - 1 + margin, 0, last),
	};
};

const inRange = ({ tx, ty }: DataTile, range: TileRange) =>
	tx >= range.x0 && tx <= range.x1 && ty >= range.y0 && ty <= range.y1;

const sameRange = (a: TileRange | null, b: TileRange) =>
	a !== null &&
	a.x0 === b.x0 &&
	a.y0 === b.y0 &&
	a.x1 === b.x1 &&
	a.y1 === b.y1;

const pointsBounds = (points: number[], size: number): Rect => {
	const r = size / 2;
	const bounds = {
		minX: Number.POSITIVE_INFINITY,
		minY: Number.POSITIVE_INFINITY,
		maxX: Number.NEGATIVE_INFINITY,
		maxY: Number.NEGATIVE_INFINITY,
	};
	for (let i = 0; i < points.length; i += 2) {
		bounds.minX = Math.min(bounds.minX, points[i] - r);
		bounds.minY = Math.min(bounds.minY, points[i + 1] - r);
		bounds.maxX = Math.max(bounds.maxX, points[i] + r);
		bounds.maxY = Math.max(bounds.maxY, points[i + 1] + r);
	}
	return bounds;
};

const toClientStroke = (stroke: TileStroke): ClientStroke => ({
	...stroke,
	bounds: pointsBounds(stroke.points, stroke.size),
});

const segmentStroke = ({ from, to, color, size }: DrawnSegment) =>
	toClientStroke({
		color,
		size,
		points:
			from.x === to.x && from.y === to.y
				? [from.x, from.y]
				: [from.x, from.y, to.x, to.y],
	});

export const createDataTiles = ({
	onLoad,
	onEvict,
}: {
	onLoad: (tile: DataTile, changed: boolean) => void;
	onEvict: (tile: DataTile) => void;
}) => {
	const tiles = new Map<string, DataTile>();
	let range: TileRange | null = null;
	let connected = false;

	const cancel = (tile: DataTile) => {
		tile.controller?.abort();
		tile.controller = null;
		if (tile.retry) clearTimeout(tile.retry);
		tile.retry = null;
	};

	const finish = (tile: DataTile, body: TileBody, etag: string | null) => {
		const unchanged =
			etag !== null && etag === tile.etag && tile.strokes !== null;
		if (!unchanged) {
			tile.strokes = body.strokes.map(toClientStroke);
			tile.etag = etag;
		}

		tile.status = "loaded";
		tile.loadedSeq = body.seq;

		let appended = false;
		for (const segment of tile.held) {
			if (segment.seq <= tile.loadedSeq) continue;
			tile.strokes?.push(segmentStroke(segment));
			appended = true;
		}
		tile.held = [];

		onLoad(tile, !unchanged || appended);
	};

	const load = async (tile: DataTile) => {
		cancel(tile);
		tile.status = "loading";
		if (!connected) return;

		const controller = new AbortController();
		tile.controller = controller;

		try {
			const res = await fetch(`/tiles/${tile.tx}/${tile.ty}`, {
				signal: controller.signal,
			});
			if (!res.ok) throw new Error(`tile ${tile.tx},${tile.ty}: ${res.status}`);
			const body: TileBody = await res.json();
			if (tile.controller !== controller) return;

			tile.controller = null;
			finish(tile, body, res.headers.get("ETag"));
		} catch {
			if (tile.controller !== controller) return;

			tile.controller = null;
			tile.retry = setTimeout(() => {
				tile.retry = null;
				if (tiles.get(tileKey(tile.tx, tile.ty)) === tile) load(tile);
			}, TILE_RETRY_MS);
		}
	};

	const setRange = (next: TileRange) => {
		if (sameRange(range, next)) return;
		range = next;

		for (const [key, tile] of tiles) {
			if (inRange(tile, next)) continue;
			cancel(tile);
			tiles.delete(key);
			onEvict(tile);
		}

		for (let ty = next.y0; ty <= next.y1; ty++) {
			for (let tx = next.x0; tx <= next.x1; tx++) {
				const key = tileKey(tx, ty);
				if (tiles.has(key)) continue;

				const tile: DataTile = {
					tx,
					ty,
					rect: tileRect({ tx, ty }),
					status: "loading",
					strokes: null,
					loadedSeq: 0,
					etag: null,
					held: [],
					controller: null,
					retry: null,
				};
				tiles.set(key, tile);
				load(tile);
			}
		}
	};

	const setConnected = (value: boolean) => {
		connected = value;
		if (!value) return;

		for (const tile of tiles.values()) {
			tile.held = [];
			load(tile);
		}
	};

	const applySegment = (segment: DrawnSegment) => {
		const appended: DataTile[] = [];

		for (const { tx, ty } of tilesForSegment(
			segment.from,
			segment.to,
			segment.size,
		)) {
			const tile = tiles.get(tileKey(tx, ty));
			if (!tile) continue;

			if (tile.status === "loading") {
				tile.held.push(segment);
			} else if (segment.seq > tile.loadedSeq) {
				tile.strokes?.push(segmentStroke(segment));
				appended.push(tile);
			}
		}

		return appended;
	};

	const isLoaded = (rect: Rect) => {
		const { x0, y0, x1, y1 } = tileRange(rect, TILE_SIZE, 0);
		for (let ty = y0; ty <= y1; ty++) {
			for (let tx = x0; tx <= x1; tx++) {
				if (!tiles.get(tileKey(tx, ty))?.strokes) return false;
			}
		}
		return true;
	};

	const overlapping = (rect: Rect) => {
		const { x0, y0, x1, y1 } = tileRange(rect, TILE_SIZE, 0);
		const found: DataTile[] = [];
		for (let ty = y0; ty <= y1; ty++) {
			for (let tx = x0; tx <= x1; tx++) {
				const tile = tiles.get(tileKey(tx, ty));
				if (tile) found.push(tile);
			}
		}
		return found;
	};

	const dispose = () => {
		for (const tile of tiles.values()) cancel(tile);
		tiles.clear();
		range = null;
	};

	return {
		setRange,
		setConnected,
		applySegment,
		isLoaded,
		overlapping,
		dispose,
	};
};

export type DataTiles = ReturnType<typeof createDataTiles>;
