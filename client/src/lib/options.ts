import type { Bounds, BrushOptions, Camera, Tool } from "#/types";

export const INITIAL_CAMERA: Camera = { x: 5000, y: 5000, zoom: 1 };

export const INITIAL_BRUSH_OPTIONS: BrushOptions = {
	tool: "pencil",
	color: "#000",
	size: 5,
};

export const BRUSH_SIZE_BOUNDS: Bounds = {
	min: 1,
	max: 32,
};

export const CAMERA_ZOOM_BOUNDS: Bounds = {
	min: 0.5,
	max: 16,
};

export const ZOOM_SENSITIVITY = 0.001;

export const RESIZE_SENSITIVITY = 0.25;

export const BROWSER_ZOOM_KEYS = ["+", "=", "-", "_", "0"];

export const TOOL_KEYS: Record<string, Tool> = {
	b: "pencil",
	e: "eraser",
};

export const COLOR_PICKER_KEY = "c";

// min ms between cursor updates sent to the server
export const CURSOR_SEND_INTERVAL = 50;
