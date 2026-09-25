import { resolve } from "node:path";

export const SAVE_INTERVAL_MS = 5000;

export const STROKE_IDLE_MS = 5000;

export const SEGMENT_RATE = 240;

export const SEGMENT_BURST = 480;

export const IP_SEGMENT_RATE = 960;

export const IP_SEGMENT_BURST = 1920;

export const MAX_CONNECTIONS_PER_IP = 8;

export const COMPACTION_MIN_POINTS = 4000;

export const DROP_LOG_INTERVAL_MS = 60_000;

export const DB_PATH = resolve(
	import.meta.dirname,
	"..",
	process.env.DB_PATH || "data/spot.db",
);

export const CLIENT_DIST = resolve(import.meta.dirname, "../../client/dist");

export const TRUST_PROXY = ["1", "true"].includes(
	process.env.TRUST_PROXY?.toLowerCase() ?? "",
);
