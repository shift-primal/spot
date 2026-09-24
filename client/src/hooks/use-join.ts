import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "#/lib/options";
import { loadName, save } from "#/lib/storage";
import { join as joinSocket, setAuthName, socket } from "#/socket";

export const useJoin = () => {
	const [storedName] = useState(loadName);
	const pendingNameRef = useRef<string | null>(null);
	const [name, setName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [renaming, setRenaming] = useState(false);

	const acceptName = useCallback((accepted: string) => {
		setName(accepted);
		setError(null);
		save(STORAGE_KEYS.name, accepted);
	}, []);

	useEffect(() => {
		const handleConnect = () => {
			if (pendingNameRef.current) acceptName(pendingNameRef.current);
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
	}, [acceptName]);

	const submitName = useCallback(
		(next: string) => {
			setError(null);

			if (!socket.connected) {
				pendingNameRef.current = next;
				joinSocket(next);
				return;
			}

			socket.emit("name:set", next, (result) => {
				if (!result.ok) return setError(result.error);

				setAuthName(result.name);
				acceptName(result.name);
				setRenaming(false);
			});
		},
		[acceptName],
	);

	useEffect(() => {
		if (storedName) submitName(storedName);
	}, [storedName, submitName]);

	const startRenaming = useCallback(() => {
		setError(null);
		setRenaming(true);
	}, []);

	const cancelRenaming = useCallback(() => {
		setError(null);
		setRenaming(false);
	}, []);

	const dialogOpen =
		renaming || (name === null && (!storedName || error !== null));

	return {
		name,
		storedName,
		error,
		dialogOpen,
		renaming,
		submitName,
		startRenaming,
		cancelRenaming,
	};
};
