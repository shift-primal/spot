import { type Bounds, WORLD_SIZE } from "@spot/shared";
import type { BrushOptions, Camera, Control, Tool } from "#/types";

export const INITIAL_CAMERA: Camera = {
	x: WORLD_SIZE.width / 2,
	y: WORLD_SIZE.height / 2,
	zoom: 1,
};

export const INITIAL_BRUSH_OPTIONS: BrushOptions = {
	tool: "pencil",
	color: "#000",
	size: 5,
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

export const TOUCH_STROKE_DELAY = 100;

export const TOUCH_STROKE_SLOP = 8;

export const TILE_MARGIN = 1;

export const RENDER_TILE_PX = 512;

export const MIN_RENDER_LEVEL = -1;

// max ms per frame spent rendering missing render tiles
export const RENDER_BUDGET_MS = 8;

export const TILE_RETRY_MS = 2000;

export const MAX_PENDING_OWN_SEGMENTS = 1024;

export const MINIMAP_OPEN_QUERY = "(min-width: 40rem)";

export const MINIMAP_VIEW_COLOR = "oklch(0.795 0.184 86.047)";

// css px
export const MINIMAP_VIEW_WIDTH = 2;

export const STORAGE_KEYS = {
	name: "spot:name",
	brush: "spot:brush",
	camera: "spot:camera",
};

const toolKey = (tool: Tool) =>
	(
		Object.keys(TOOL_KEYS).find((key) => TOOL_KEYS[key] === tool) ?? ""
	).toUpperCase();

export const SHORTCUTS: Control[] = [
	{ label: "Pencil", keys: [[toolKey("pencil")]] },
	{ label: "Eraser", keys: [[toolKey("eraser")]] },
	{ label: "Color picker", keys: [[COLOR_PICKER_KEY.toUpperCase()]] },
	{ label: "Draw with the other tool", keys: [["Right drag"]] },
	{ label: "Resize brush", keys: [["Shift", "Drag"]] },
	{ label: "Pan", keys: [["Space", "Drag"], ["Middle drag"]] },
	{ label: "Zoom", keys: [["Scroll"]] },
];

export const GESTURES: Control[] = [
	{ label: "Draw", keys: [["One finger"]] },
	{ label: "Pan", keys: [["Two finger drag"]] },
	{ label: "Zoom", keys: [["Pinch"]] },
];
