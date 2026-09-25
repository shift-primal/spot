import { createServer } from "node:http";
import {
	type ClientToServerEvents,
	OVERVIEW_SEQ_HEADER,
	parseName,
	type ServerToClientEvents,
} from "@spot/shared";
import express from "express";
import { Server } from "socket.io";
import {
	closeAllStrokes,
	closeIdleStrokes,
	closeSocketStrokes,
	drawSegment,
	endStroke,
	save,
	tileBody,
	tileEtag,
} from "./canvas.ts";
import { compactTiles } from "./compact.ts";
import { db } from "./db.ts";
import {
	acquireConnection,
	clientIp,
	createDropLog,
	createLimiter,
	releaseConnection,
} from "./limits.ts";
import { CLIENT_DIST, SAVE_INTERVAL_MS, STROKE_IDLE_MS } from "./options.ts";
import { overview } from "./overview.ts";
import { isStrokeId, parseSegment, parseTile } from "./validate.ts";

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT;

interface SocketData {
	name: string;
	ip: string;
}

const io = new Server<
	ClientToServerEvents,
	ServerToClientEvents,
	Record<string, never>,
	SocketData
>(httpServer, {
	cors: { origin: "http://localhost:5173" },
});

// reject connections without a valid name
io.use((socket, next) => {
	const name = parseName(socket.handshake.auth.name);
	if (!name) return next(new Error("invalid name"));

	const ip = clientIp(socket);
	if (!acquireConnection(ip)) return next(new Error("too many connections"));

	socket.data.name = name;
	socket.data.ip = ip;
	next();
});

io.on("connection", (socket) => {
	console.log("connected:", socket.id, socket.data.name);

	const limit = createLimiter(socket.data.ip);
	const drops = createDropLog(socket.id);

	socket.on("segment:draw", (raw) => {
		const segment = parseSegment(raw);
		if (!segment) return drops.drop("invalid");

		const limited = limit();
		if (limited) return drops.drop(limited);

		const drawn = drawSegment(socket.id, segment);
		if (drawn) io.emit("segment:draw", drawn);
	});

	socket.on("stroke:end", (strokeId) => {
		if (!isStrokeId(strokeId) || limit()) return;
		endStroke(socket.id, strokeId);
	});

	socket.on("name:set", (name, callback) => {
		if (typeof callback !== "function") return;

		const parsed = parseName(name);
		if (!parsed) return callback({ ok: false, error: "invalid name" });

		socket.data.name = parsed;
		callback({ ok: true, name: parsed });
	});

	socket.on("cursor:move", (cursor) => {
		socket.broadcast.volatile.emit("cursor:move", socket.id, {
			...cursor,
			name: socket.data.name,
		});
	});

	socket.on("cursor:leave", () => {
		socket.broadcast.emit("cursor:leave", socket.id);
	});

	socket.on("disconnect", () => {
		console.log("disconnected:", socket.id);
		closeSocketStrokes(socket.id);
		releaseConnection(socket.data.ip);
		drops.flush();
		socket.broadcast.emit("cursor:leave", socket.id);
	});
});

app.get("/health", (_req, res) => res.send("ok"));

app.use(
	"/assets",
	express.static(`${CLIENT_DIST}/assets`, { immutable: true, maxAge: "1y" }),
);
app.use(express.static(CLIENT_DIST));

app.get("/tiles/:tx/:ty", (req, res) => {
	const tile = parseTile(req.params.tx, req.params.ty);
	if (!tile) return res.sendStatus(404);

	const etag = tileEtag(tile);
	res.set({ ETag: etag, "Cache-Control": "no-cache" });

	const cached = req.get("If-None-Match")?.split(",") ?? [];
	if (cached.some((tag) => tag.trim().replace(/^W\//, "") === etag)) {
		return res.status(304).end();
	}

	res.type("json").send(tileBody(tile));
});

app.get("/overview", async (_req, res) => {
	const { png, seq } = await overview();
	res.set({ [OVERVIEW_SEQ_HEADER]: String(seq), "Cache-Control": "no-store" });
	res.type("png").send(png);
});

const saveInterval = setInterval(() => {
	try {
		closeIdleStrokes(STROKE_IDLE_MS);
		compactTiles(save());
	} catch (error) {
		console.error("save failed:", error);
	}
}, SAVE_INTERVAL_MS);

const shutdown = () => {
	clearInterval(saveInterval);
	closeAllStrokes();
	save();
	db.close();
	process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

httpServer.listen(port, () => console.log(`listening on ${port}`));
