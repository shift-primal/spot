import type {
	ClientToServerEvents,
	JoinAuth,
	ServerToClientEvents,
} from "@spot/shared";
import { io, type Socket } from "socket.io-client";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
	autoConnect: false,
});

export const setAuthName = (name: string) => {
	const auth: JoinAuth = { name };
	socket.auth = auth;
};

export const join = (name: string) => {
	setAuthName(name);
	socket.connect();
};
