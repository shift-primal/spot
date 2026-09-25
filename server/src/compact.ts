import { isWhite, TILE_SIZE, tileRect } from "@spot/shared";
import { bumpTile, isTileOpen, parseTileKey } from "./canvas.ts";
import { type StrokeRow, statements, type TileRow, transaction } from "./db.ts";
import { COMPACTION_MIN_POINTS } from "./options.ts";

const CELL_MARGIN = 0.71;

interface Piece {
	id: number;
	white: boolean;
	radius: number;
	points: number[];
}

type Span = [number, number];

const capsuleSpan = (
	ax: number,
	ay: number,
	bx: number,
	by: number,
	radius: number,
	y: number,
): Span | null => {
	let lo = Number.POSITIVE_INFINITY;
	let hi = Number.NEGATIVE_INFINITY;

	for (const [px, py] of [
		[ax, ay],
		[bx, by],
	]) {
		const h = radius * radius - (y - py) ** 2;
		if (h < 0) continue;
		const w = Math.sqrt(h);
		lo = Math.min(lo, px - w);
		hi = Math.max(hi, px + w);
	}

	const dx = bx - ax;
	const dy = by - ay;
	const length2 = dx * dx + dy * dy;
	if (length2 > 0) {
		const ry = y - ay;
		const reach = radius * Math.sqrt(length2);
		let bandLo = Number.NEGATIVE_INFINITY;
		let bandHi = Number.POSITIVE_INFINITY;

		if (dy !== 0) {
			const e1 = (ry * dx - reach) / dy;
			const e2 = (ry * dx + reach) / dy;
			bandLo = Math.max(bandLo, ax + Math.min(e1, e2));
			bandHi = Math.min(bandHi, ax + Math.max(e1, e2));
		} else if (Math.abs(ry * dx) > reach) {
			bandLo = Number.POSITIVE_INFINITY;
		}

		if (dx !== 0) {
			const e1 = -(ry * dy) / dx;
			const e2 = (length2 - ry * dy) / dx;
			bandLo = Math.max(bandLo, ax + Math.min(e1, e2));
			bandHi = Math.min(bandHi, ax + Math.max(e1, e2));
		} else if (ry * dy < 0 || ry * dy > length2) {
			bandLo = Number.POSITIVE_INFINITY;
		}

		if (bandLo <= bandHi) {
			lo = Math.min(lo, bandLo);
			hi = Math.max(hi, bandHi);
		}
	}

	return lo <= hi ? [lo, hi] : null;
};

const forEachCellRow = (
	{ points }: Piece,
	radius: number,
	originX: number,
	originY: number,
	visit: (offset: number, start: number, end: number) => boolean | undefined,
) => {
	const last = points.length === 2 ? 0 : points.length - 4;

	for (let p = 0; p <= last; p += 2) {
		const ax = points[p];
		const ay = points[p + 1];
		const bx = points.length === 2 ? ax : points[p + 2];
		const by = points.length === 2 ? ay : points[p + 3];

		const j0 = Math.max(
			0,
			Math.ceil(Math.min(ay, by) - radius - originY - 0.5),
		);
		const j1 = Math.min(
			TILE_SIZE - 1,
			Math.floor(Math.max(ay, by) + radius - originY - 0.5),
		);

		for (let j = j0; j <= j1; j++) {
			const span = capsuleSpan(ax, ay, bx, by, radius, originY + j + 0.5);
			if (!span) continue;
			const i0 = Math.max(0, Math.ceil(span[0] - originX - 0.5));
			const i1 = Math.min(TILE_SIZE - 1, Math.floor(span[1] - originX - 0.5));
			if (i0 > i1) continue;
			if (visit(j * TILE_SIZE, i0, i1)) return true;
		}
	}

	return false;
};

const anySet =
	(cells: Uint8Array) => (offset: number, i0: number, i1: number) =>
		cells.subarray(offset + i0, offset + i1 + 1).includes(1);

const anyUnset =
	(cells: Uint8Array) => (offset: number, i0: number, i1: number) =>
		cells.subarray(offset + i0, offset + i1 + 1).includes(0);

const fill =
	(cells: Uint8Array) => (offset: number, i0: number, i1: number) => {
		cells.fill(1, offset + i0, offset + i1 + 1);
		return false;
	};

const findDeadPieces = (pieces: Piece[], originX: number, originY: number) => {
	const dead = new Set<number>();
	const sealed = new Uint8Array(TILE_SIZE * TILE_SIZE);

	for (let k = pieces.length - 1; k >= 0; k--) {
		const piece = pieces[k];
		const touch = piece.radius + CELL_MARGIN;
		const cover = piece.radius - CELL_MARGIN;

		if (!forEachCellRow(piece, touch, originX, originY, anyUnset(sealed))) {
			dead.add(piece.id);
			continue;
		}
		if (cover > 0) {
			forEachCellRow(piece, cover, originX, originY, fill(sealed));
		}
	}

	const painted = new Uint8Array(TILE_SIZE * TILE_SIZE);

	for (const piece of pieces) {
		if (dead.has(piece.id)) continue;
		const touch = piece.radius + CELL_MARGIN;

		if (!piece.white) {
			forEachCellRow(piece, touch, originX, originY, fill(painted));
		} else if (
			!forEachCellRow(piece, touch, originX, originY, anySet(painted))
		) {
			dead.add(piece.id);
		}
	}

	return dead;
};

const compactTile = (key: string) => {
	const start = performance.now();
	const tile = parseTileKey(key);
	const { minX, minY } = tileRect(tile);

	const rows = statements.tileStrokes.all(
		tile.tx,
		tile.ty,
	) as unknown as StrokeRow[];
	const pieces: Piece[] = rows.map((row) => ({
		id: row.id,
		white: isWhite(row.color),
		radius: row.size / 2,
		points: JSON.parse(row.points),
	}));

	const dead = findDeadPieces(pieces, minX, minY);
	let removedPoints = 0;
	for (const piece of pieces) {
		if (dead.has(piece.id)) removedPoints += piece.points.length / 2;
	}

	transaction(() => {
		for (const id of dead) statements.deleteStroke.run(id);
		statements.compactTile.run(
			removedPoints,
			removedPoints,
			new Date().toISOString(),
			tile.tx,
			tile.ty,
		);
	});

	if (dead.size) bumpTile(key);

	console.log(
		`compacted tile ${key}: ${rows.length} rows to ${rows.length - dead.size} in ${(performance.now() - start).toFixed(1)} ms`,
	);
};

export const compactTiles = (keys: string[]) => {
	for (const key of keys) {
		if (isTileOpen(key)) continue;

		const { tx, ty } = parseTileKey(key);
		const row = statements.tile.get(tx, ty) as TileRow | undefined;
		if (!row) continue;

		const trigger = Math.max(
			COMPACTION_MIN_POINTS,
			2 * row.points_at_compaction,
		);
		if (row.point_count >= trigger) compactTile(key);
	}
};
