import { type Point, WORLD_SIZE } from "@spot/shared";
import { useCallback, useRef, useState } from "react";
import { clampAxis } from "#/lib/camera";
import { clamp } from "#/lib/general";
import { CAMERA_ZOOM_BOUNDS, INITIAL_CAMERA } from "#/lib/options";
import type { Camera } from "#/types";

export const useCamera = () => {
	const cameraRef = useRef<Camera>({ ...INITIAL_CAMERA });
	const [zoom, setZoom] = useState(INITIAL_CAMERA.zoom);

	const clampToWorld = (viewport: { width: number; height: number }) => {
		const camera = cameraRef.current;
		camera.x = clampAxis(
			camera.x,
			viewport.width / camera.zoom,
			WORLD_SIZE.width,
		);
		camera.y = clampAxis(
			camera.y,
			viewport.height / camera.zoom,
			WORLD_SIZE.height,
		);
	};

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

		setZoom(camera.zoom);
	};

	return { cameraRef, zoom, screenToWorld, panBy, zoomAt, clampToWorld };
};
