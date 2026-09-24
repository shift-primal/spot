import type { Point } from "@spot/shared";
import { useCallback, useRef } from "react";
import type { Camera } from "#/types";

export const useCamera = () => {
	const cameraRef = useRef<Camera>({ x: 200, y: 200, zoom: 4 });

	const screenToWorld = useCallback((p: Point): Point => {
		const { x, y, zoom } = cameraRef.current;
		return { x: p.x / zoom + x, y: p.y / zoom + y };
	}, []);

	const panBy = (delta: Point) => {
		const camera = cameraRef.current;
		camera.x -= delta.x / camera.zoom;
		camera.y -= delta.y / camera.zoom;
	};

	return { cameraRef, screenToWorld, panBy };
};
