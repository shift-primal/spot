import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DB_PATH } from "./options.ts";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
	PRAGMA journal_mode = WAL;

	CREATE TABLE IF NOT EXISTS strokes (
		id     INTEGER PRIMARY KEY AUTOINCREMENT,
		tx     INTEGER NOT NULL,
		ty     INTEGER NOT NULL,
		seq    INTEGER NOT NULL,
		color  TEXT    NOT NULL,
		size   REAL    NOT NULL,
		points TEXT    NOT NULL
	);
	CREATE INDEX IF NOT EXISTS strokes_tile ON strokes (tx, ty, seq);

	CREATE TABLE IF NOT EXISTS tiles (
		tx                   INTEGER NOT NULL,
		ty                   INTEGER NOT NULL,
		point_count          INTEGER NOT NULL DEFAULT 0,
		points_at_compaction INTEGER NOT NULL DEFAULT 0,
		compacted_at         TEXT,
		PRIMARY KEY (tx, ty)
	);
`);

export interface StrokeRow {
	id: number;
	seq: number;
	color: string;
	size: number;
	points: string;
}

export interface TileRow {
	point_count: number;
	points_at_compaction: number;
}

export const statements = {
	maxSeq: db.prepare("SELECT MAX(seq) AS seq FROM strokes"),
	insertStroke: db.prepare(
		"INSERT INTO strokes (tx, ty, seq, color, size, points) VALUES (?, ?, ?, ?, ?, ?)",
	),
	addTilePoints: db.prepare(
		`INSERT INTO tiles (tx, ty, point_count) VALUES (?, ?, ?)
		ON CONFLICT (tx, ty) DO UPDATE SET point_count = point_count + excluded.point_count`,
	),
	tileStrokes: db.prepare(
		"SELECT id, seq, color, size, points FROM strokes WHERE tx = ? AND ty = ? ORDER BY seq, id",
	),
	tile: db.prepare(
		"SELECT point_count, points_at_compaction FROM tiles WHERE tx = ? AND ty = ?",
	),
	deleteStroke: db.prepare("DELETE FROM strokes WHERE id = ?"),
	compactTile: db.prepare(
		`UPDATE tiles SET
			point_count = point_count - ?,
			points_at_compaction = point_count - ?,
			compacted_at = ?
		WHERE tx = ? AND ty = ?`,
	),
};

export const transaction = (run: () => void) => {
	db.exec("BEGIN");
	try {
		run();
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
};
