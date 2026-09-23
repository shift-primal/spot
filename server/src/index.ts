import { createServer } from "node:http";
import type {
	ClientToServerEvents,
	Segment,
	ServerToClientEvents,
} from "@spot/shared";
import express from "express";
import { Server } from "socket.io";

const MAX_SEGMENTS = 50000;

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
	cors: { origin: "http://localhost:5173" },
});

const history: Segment[] = [];

io.on("connection", (socket) => {
	console.log("connected:", socket.id);

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

	socket.on("disconnect", () => console.log("disconnected:", socket.id));
});

app.get("/health", (_req, res) => res.send("ok"));

httpServer.listen(3000, () => console.log("listening on :3000"));
