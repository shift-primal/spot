import { useCallback, useEffect, useState } from "react";
import { join as joinSocket, socket } from "#/socket";

export const useJoin = () => {
	const [joined, setJoined] = useState(socket.connected);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleConnect = () => {
			setJoined(true);
			setError(null);
		};

		const handleError = (err: Error) =>
			setError(
				socket.active ? "Can't reach the server, retrying…" : err.message,
			);

		socket.on("connect", handleConnect);
		socket.on("connect_error", handleError);

		return () => {
			socket.off("connect", handleConnect);
			socket.off("connect_error", handleError);
		};
	}, []);

	const join = useCallback((name: string) => {
		setError(null);
		joinSocket(name);
	}, []);

	return { joined, error, join };
};
