import {
	BRUSH_SIZE_BOUNDS,
	HEX_COLOR,
	MAX_SEGMENT_LENGTH,
	type Point,
	roundPoint,
	type Segment,
	TILE_COUNT,
	type Tile,
	WORLD_SIZE,
} from "@spot/shared";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

export const isStrokeId = (value: unknown): value is number =>
	Number.isSafeInteger(value) && (value as number) >= 0;

const parsePoint = (value: unknown): Point | null => {
	if (!isRecord(value)) return null;
	const { x, y } = value;
	if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
	if (x < 0 || x > WORLD_SIZE.width || y < 0 || y > WORLD_SIZE.height) {
		return null;
	}
	return roundPoint({ x, y });
};

export const parseSegment = (value: unknown): Segment | null => {
	if (!isRecord(value)) return null;

	const { strokeId, color, size } = value;
	if (!isStrokeId(strokeId)) return null;
	if (typeof color !== "string" || !HEX_COLOR.test(color)) return null;
	if (!isFiniteNumber(size)) return null;
	if (size < BRUSH_SIZE_BOUNDS.min || size > BRUSH_SIZE_BOUNDS.max) return null;

	const from = parsePoint(value.from);
	const to = parsePoint(value.to);
	if (!from || !to) return null;
	if (Math.hypot(to.x - from.x, to.y - from.y) > MAX_SEGMENT_LENGTH) {
		return null;
	}

	return { strokeId, from, to, color, size };
};

export const parseTile = (tx: string, ty: string): Tile | null => {
	if (!/^\d+$/.test(tx) || !/^\d+$/.test(ty)) return null;
	const tile = { tx: Number(tx), ty: Number(ty) };
	if (tile.tx >= TILE_COUNT || tile.ty >= TILE_COUNT) return null;
	return tile;
};
