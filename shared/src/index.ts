export interface Point {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Bounds {
	min: number;
	max: number;
}

export interface Rect {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface Tile {
	tx: number;
	ty: number;
}

export interface Segment {
	strokeId: number;
	from: Point;
	to: Point;
	color: string;
	size: number;
}

export interface DrawnSegment {
	seq: number;
	from: Point;
	to: Point;
	color: string;
	size: number;
}

export interface TileStroke {
	color: string;
	size: number;
	points: number[];
}

export interface TileBody {
	seq: number;
	strokes: TileStroke[];
}

export interface Cursor {
	position: Point;
	color: string;
	size: number;
}

export interface RemoteCursor extends Cursor {
	name: string;
}

export interface JoinAuth {
	name: string;
}

export type NameResult =
	| { ok: true; name: string }
	| { ok: false; error: string };

export const NAME_MAX_LENGTH = 24;

export const parseName = (name: unknown): string | null => {
	if (typeof name !== "string") return null;
	const trimmed = name.trim();
	if (!trimmed || trimmed.length > NAME_MAX_LENGTH) return null;
	return trimmed;
};

export interface ServerToClientEvents {
	"segment:draw": (segment: DrawnSegment) => void;
	"cursor:move": (id: string, cursor: RemoteCursor) => void;
	"cursor:leave": (id: string) => void;
}

export interface ClientToServerEvents {
	"segment:draw": (segment: Segment) => void;
	"stroke:end": (strokeId: number) => void;
	"cursor:move": (cursor: Cursor) => void;
	"cursor:leave": () => void;
	"name:set": (name: string, callback: (result: NameResult) => void) => void;
}

export const WORLD_SIZE: Size = {
	width: 32768,
	height: 32768,
};

export const TILE_SIZE = 512;

export const TILE_COUNT = Math.ceil(WORLD_SIZE.width / TILE_SIZE);

export const OVERVIEW_SCALE = 1 / 16;

export const OVERVIEW_SEQ_HEADER = "X-Overview-Seq";

export const overviewLineWidth = (size: number) =>
	Math.max(size, 1 / OVERVIEW_SCALE);

export const POINT_PRECISION = 1 / 16;

export const BRUSH_SIZE_BOUNDS: Bounds = {
	min: 1,
	max: 32,
};

export const MAX_SEGMENT_LENGTH = 1024;

export const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isWhite = (color: string) => {
	const lower = color.toLowerCase();
	return lower === "#fff" || lower === "#ffffff";
};

const roundCoordinate = (value: number) =>
	Math.round(value / POINT_PRECISION) * POINT_PRECISION;

export const roundPoint = (p: Point): Point => ({
	x: roundCoordinate(p.x),
	y: roundCoordinate(p.y),
});

export const tileKey = (tx: number, ty: number) => `${tx},${ty}`;

export const tileRect = ({ tx, ty }: Tile): Rect => ({
	minX: tx * TILE_SIZE,
	minY: ty * TILE_SIZE,
	maxX: (tx + 1) * TILE_SIZE,
	maxY: (ty + 1) * TILE_SIZE,
});

export const rectsOverlap = (a: Rect, b: Rect) =>
	a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

const segmentHitsRect = (from: Point, to: Point, rect: Rect) => {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const edges: [number, number][] = [
		[-dx, from.x - rect.minX],
		[dx, rect.maxX - from.x],
		[-dy, from.y - rect.minY],
		[dy, rect.maxY - from.y],
	];

	let t0 = 0;
	let t1 = 1;
	for (const [p, q] of edges) {
		if (p === 0) {
			if (q < 0) return false;
			continue;
		}
		const t = q / p;
		if (p < 0) {
			if (t > t1) return false;
			if (t > t0) t0 = t;
		} else {
			if (t < t0) return false;
			if (t < t1) t1 = t;
		}
	}
	return true;
};

const clampTile = (index: number) =>
	Math.min(TILE_COUNT - 1, Math.max(0, index));

export const tilesForSegment = (from: Point, to: Point, size: number) => {
	const r = size / 2;
	const tx0 = clampTile(Math.floor((Math.min(from.x, to.x) - r) / TILE_SIZE));
	const tx1 = clampTile(Math.floor((Math.max(from.x, to.x) + r) / TILE_SIZE));
	const ty0 = clampTile(Math.floor((Math.min(from.y, to.y) - r) / TILE_SIZE));
	const ty1 = clampTile(Math.floor((Math.max(from.y, to.y) + r) / TILE_SIZE));

	const tiles: Tile[] = [];
	for (let ty = ty0; ty <= ty1; ty++) {
		for (let tx = tx0; tx <= tx1; tx++) {
			const rect = tileRect({ tx, ty });
			const grown: Rect = {
				minX: rect.minX - r,
				minY: rect.minY - r,
				maxX: rect.maxX + r,
				maxY: rect.maxY + r,
			};
			if (segmentHitsRect(from, to, grown)) tiles.push({ tx, ty });
		}
	}
	return tiles;
};
