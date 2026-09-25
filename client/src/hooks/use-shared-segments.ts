import type { DrawnSegment, Segment } from "@spot/shared";
import { useCallback, useEffect } from "react";
import { socket } from "#/socket";

export const useSharedSegments = ({
	onSegment,
	onConnectionChange,
}: {
	onSegment: (segment: DrawnSegment) => void;
	onConnectionChange: (connected: boolean) => void;
}) => {
	useEffect(() => {
		const handleConnect = () => onConnectionChange(true);
		const handleDisconnect = () => onConnectionChange(false);

		socket.on("segment:draw", onSegment);
		socket.on("connect", handleConnect);
		socket.on("disconnect", handleDisconnect);
		if (socket.connected) handleConnect();

		return () => {
			socket.off("segment:draw", onSegment);
			socket.off("connect", handleConnect);
			socket.off("disconnect", handleDisconnect);
		};
	}, [onSegment, onConnectionChange]);

	const sendSegment = useCallback((segment: Segment) => {
		socket.emit("segment:draw", segment);
	}, []);

	const endStroke = useCallback((strokeId: number) => {
		socket.emit("stroke:end", strokeId);
	}, []);

	return { sendSegment, endStroke };
};
