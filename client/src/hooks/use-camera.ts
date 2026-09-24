import { type Point, WORLD_SIZE } from "@spot/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { clampAxis } from "#/lib/camera";
import { clamp } from "#/lib/general";
import { CAMERA_ZOOM_BOUNDS, STORAGE_KEYS } from "#/lib/options";
import { loadCamera, save } from "#/lib/storage";
import type { Camera } from "#/types";

export const useCamera = () => {
	const [initialCamera] = useState(loadCamera);
	const cameraRef = useRef<Camera>(initialCamera);
	const [zoom, setZoom] = useState(initialCamera.zoom);

	useEffect(() => {
		const saveCamera = () => save(STORAGE_KEYS.camera, cameraRef.current);
		const handleVisibility = () => {
			if (document.visibilityState === "hidden") saveCamera();
		};

		document.addEventListener("visibilitychange", handleVisibility);
		window.addEventListener("pagehide", saveCamera);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("pagehide", saveCamera);
		};
	}, []);

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
