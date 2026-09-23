import { createServer } from "node:http";
import type { DrawPayload } from "@spot/shared";
import express from "express";
import { Server } from "socket.io";

const MAX_SEGMENTS = 50000;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
	cors: { origin: "http://localhost:5173" },
});

const drawingSegments: DrawPayload[] = [];

io.on("connection", (socket) => {
	console.log("connected:", socket.id);

	socket.on("getHistory", (callback) => {
		callback(drawingSegments);
	});

	socket.on("draw", (segment) => {
		socket.broadcast.emit("draw", segment);

		if (drawingSegments.length >= MAX_SEGMENTS) {
			drawingSegments.push(segment);
		} else {
			drawingSegments.length = 0;
			drawingSegments.push(segment);
		}
	});

	socket.on("disconnect", () => console.log("disconnected:", socket.id));
});

app.get("/health", (_req, res) => res.send("ok"));

httpServer.listen(3000, () => console.log("listening on :3000"));
