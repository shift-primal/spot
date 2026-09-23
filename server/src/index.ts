import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: { origin: "http://localhost:5173" },
});

io.on("connection", (socket) => {
	console.log("connected:", socket.id);

	socket.on("draw", (segment) => {
		socket.broadcast.emit("draw", segment);
	});

	socket.on("disconnect", () => console.log("disconnected:", socket.id));
});

app.get("/health", (_req, res) => res.send("ok"));

httpServer.listen(3000, () => console.log("listening on :3000"));
