import { randomUUID } from "node:crypto";
import {
	type DrawnSegment,
	type Segment,
	type Tile,
	tileKey,
	tilesForSegment,
} from "@spot/shared";
import { type StrokeRow, statements, transaction } from "./db.ts";

interface Stroke {
	seq: number;
	color: string;
	size: number;
	points: number[];
	segmentTiles: string[][];
	lastAt: number;
	tiles: Set<string>;
}

interface Run {
	key: string;
	points: number[];
}

const maxRow = statements.maxSeq.get() as { seq: number | null } | undefined;

let seq = (maxRow?.seq ?? 0) + 1;

const bootId = randomUUID();

const openStrokes = new Map<string, Stroke>();

const closedStrokes: Stroke[] = [];

const tileSeq = new Map<string, number>();

export const parseTileKey = (key: string): Tile => {
	const [tx, ty] = key.split(",").map(Number);
	return { tx, ty };
};

export const tileEtag = ({ tx, ty }: Tile) =>
	`"${bootId}-${tileSeq.get(tileKey(tx, ty)) ?? 0}"`;

export const bumpTile = (key: string) => {
	tileSeq.set(key, ++seq);
};

export const isTileOpen = (key: string) => {
	for (const stroke of openStrokes.values()) {
		if (stroke.tiles.has(key)) return true;
	}
	return false;
};

const strokeKey = (socketId: string, strokeId: number) =>
	`${socketId}:${strokeId}`;

const endsAt = (stroke: Stroke, x: number, y: number) =>
	stroke.points[stroke.points.length - 2] === x &&
	stroke.points[stroke.points.length - 1] === y;

const closeStroke = (key: string) => {
	const stroke = openStrokes.get(key);
	if (!stroke) return;
	openStrokes.delete(key);
	closedStrokes.push(stroke);
};

export const drawSegment = (
	socketId: string,
	{ strokeId, from, to, color, size }: Segment,
): DrawnSegment | null => {
	const key = strokeKey(socketId, strokeId);
	const now = performance.now();
	const isDot = from.x === to.x && from.y === to.y;

	let stroke = openStrokes.get(key);
	if (
		stroke &&
		(stroke.color !== color ||
			stroke.size !== size ||
			!endsAt(stroke, from.x, from.y))
	) {
		closeStroke(key);
		stroke = undefined;
	}

	if (stroke && isDot) {
		stroke.lastAt = now;
		return null;
	}

	const segmentSeq = ++seq;
	const tiles = tilesForSegment(from, to, size).map(({ tx, ty }) =>
		tileKey(tx, ty),
	);

	if (!stroke) {
		stroke = {
			seq: segmentSeq,
			color,
			size,
			points: [from.x, from.y],
			segmentTiles: [],
			lastAt: now,
			tiles: new Set(),
		};
		openStrokes.set(key, stroke);
	} else if (stroke.points.length === 2) {
		stroke.segmentTiles = [];
	}

	if (!isDot) stroke.points.push(to.x, to.y);
	stroke.segmentTiles.push(tiles);
	stroke.lastAt = now;

	for (const tile of tiles) {
		stroke.tiles.add(tile);
		tileSeq.set(tile, segmentSeq);
	}

	return { seq: segmentSeq, from, to, color, size };
};

export const endStroke = (socketId: string, strokeId: number) =>
	closeStroke(strokeKey(socketId, strokeId));

export const closeSocketStrokes = (socketId: string) => {
	for (const key of openStrokes.keys()) {
		if (key.startsWith(`${socketId}:`)) closeStroke(key);
	}
};

export const closeIdleStrokes = (idleMs: number) => {
	const now = performance.now();
	for (const [key, stroke] of openStrokes) {
		if (now - stroke.lastAt >= idleMs) closeStroke(key);
	}
};

export const closeAllStrokes = () => {
	for (const key of openStrokes.keys()) closeStroke(key);
};

const cutRuns = ({ points, segmentTiles }: Stroke) => {
	const runs: Run[] = [];
	const active = new Map<string, Run & { end: number }>();
	const pointsPerSegment = points.length === 2 ? 2 : 4;

	segmentTiles.forEach((tiles, i) => {
		for (const key of tiles) {
			const run = active.get(key);
			if (run && run.end === i - 1) {
				run.points.push(points[2 * i + 2], points[2 * i + 3]);
				run.end = i;
				continue;
			}
			const next = {
				key,
				points: points.slice(2 * i, 2 * i + pointsPerSegment),
				end: i,
			};
			runs.push(next);
			active.set(key, next);
		}
	});

	return runs;
};

export const save = () => {
	if (!closedStrokes.length) return [];

	const start = performance.now();
	const strokes = closedStrokes.splice(0);
	const tilePoints = new Map<string, number>();
	let rows = 0;

	try {
		transaction(() => {
			for (const stroke of strokes) {
				for (const run of cutRuns(stroke)) {
					const { tx, ty } = parseTileKey(run.key);
					statements.insertStroke.run(
						tx,
						ty,
						stroke.seq,
						stroke.color,
						stroke.size,
						JSON.stringify(run.points),
					);
					rows++;
					tilePoints.set(
						run.key,
						(tilePoints.get(run.key) ?? 0) + run.points.length / 2,
					);
				}
			}

			for (const [key, count] of tilePoints) {
				const { tx, ty } = parseTileKey(key);
				statements.addTilePoints.run(tx, ty, count);
			}
		});
	} catch (error) {
		closedStrokes.unshift(...strokes);
		throw error;
	}

	console.log(
		`saved ${strokes.length} strokes, ${rows} rows in ${(performance.now() - start).toFixed(1)} ms`,
	);

	return [...tilePoints.keys()];
};

const strokeJson = (color: string, size: number, points: string) =>
	`{"color":${JSON.stringify(color)},"size":${size},"points":${points}}`;

export const tileBody = ({ tx, ty }: Tile) => {
	const key = tileKey(tx, ty);
	const rows = statements.tileStrokes.all(tx, ty) as unknown as StrokeRow[];

	const entries = rows.map((row) => ({
		seq: row.seq,
		json: strokeJson(row.color, row.size, row.points),
	}));

	for (const stroke of [...closedStrokes, ...openStrokes.values()]) {
		if (!stroke.tiles.has(key)) continue;
		for (const run of cutRuns(stroke)) {
			if (run.key !== key) continue;
			entries.push({
				seq: stroke.seq,
				json: strokeJson(stroke.color, stroke.size, JSON.stringify(run.points)),
			});
		}
	}

	entries.sort((a, b) => a.seq - b.seq);

	return `{"seq":${seq},"strokes":[${entries.map((entry) => entry.json).join(",")}]}`;
};
