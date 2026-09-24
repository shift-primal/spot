import { createServer } from "node:http";
import {
	type ClientToServerEvents,
	parseName,
	type Segment,
	type ServerToClientEvents,
} from "@spot/shared";
import express from "express";
import { Server } from "socket.io";

const MAX_SEGMENTS = 50000;

const app = express();
const httpServer = createServer(app);

interface SocketData {
	name: string;
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

	socket.data.name = name;
	next();
});

const history: Segment[] = [];

io.on("connection", (socket) => {
	console.log("connected:", socket.id, socket.data.name);

	socket.on("history:get", (callback) => {
		callback(history);
	});

	socket.on("segment:draw", (segment) => {
		socket.broadcast.emit("segment:draw", segment);

		if (history.length < MAX_SEGMENTS) {
			history.push(segment);
		} else {
			history.length = 0;
			history.push(segment);
		}
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
		socket.broadcast.emit("cursor:leave", socket.id);
	});
});

app.get("/health", (_req, res) => res.send("ok"));

httpServer.listen(3000, () => console.log("listening on :3000"));
