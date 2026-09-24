import type { Segment } from "@spot/shared";
import { useCallback, useEffect } from "react";
import { socket } from "#/socket";

export const useSharedSegments = (
	onSegments: (segments: Segment[]) => void,
) => {
	// setup socket
	useEffect(() => {
		socket.emit("history:get", onSegments);

		const onRemoteSegment = (segment: Segment) => onSegments([segment]);

		socket.on("segment:draw", onRemoteSegment);

		return () => {
			socket.off("segment:draw", onRemoteSegment);
		};
	}, [onSegments]);

	const sendSegment = useCallback((segment: Segment) => {
		socket.emit("segment:draw", segment);
	}, []);

	return { sendSegment };
};
