import type { Bounds, Camera } from "#/types";

export const INITIAL_CAMERA: Camera = { x: 5000, y: 5000, zoom: 1 };

export const BRUSH_SIZE_BOUNDS: Bounds = {
	min: 1,
	max: 32,
};

export const CAMERA_ZOOM_BOUNDS: Bounds = {
	min: 1,
	max: 64,
};
