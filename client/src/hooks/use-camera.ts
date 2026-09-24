import type { Point } from "@spot/shared";
import { useCallback, useRef } from "react";
import { clamp } from "#/lib/general";
import { CAMERA_ZOOM_BOUNDS } from "#/lib/options";
import type { Camera } from "#/types";

export const useCamera = () => {
	const cameraRef = useRef<Camera>({ x: 5000, y: 5000, zoom: 4 });

	const screenToWorld = useCallback((p: Point): Point => {
		const { x, y, zoom } = cameraRef.current;
		return { x: p.x / zoom + x, y: p.y / zoom + y };
	}, []);

	const panBy = (delta: Point) => {
		const camera = cameraRef.current;
		camera.x -= delta.x / camera.zoom;
		camera.y -= delta.y / camera.zoom;
	};

	const zoomAt = (screenPoint: Point, factor: number) => {
		const camera = cameraRef.current;

		const before = screenToWorld(screenPoint);

		camera.zoom = clamp(
			camera.zoom * factor,
			CAMERA_ZOOM_BOUNDS.min,
			CAMERA_ZOOM_BOUNDS.max,
		);

		camera.x = before.x - screenPoint.x / camera.zoom;
		camera.y = before.y - screenPoint.y / camera.zoom;
	};

	return { cameraRef, screenToWorld, panBy, zoomAt };
};
