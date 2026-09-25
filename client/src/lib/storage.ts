import { BRUSH_SIZE_BOUNDS, HEX_COLOR, parseName } from "@spot/shared";
import { clamp } from "#/lib/general";
import {
	CAMERA_ZOOM_BOUNDS,
	INITIAL_BRUSH_OPTIONS,
	INITIAL_CAMERA,
	STORAGE_KEYS,
} from "#/lib/options";
import type { BrushOptions, Camera } from "#/types";

const load = (key: string): unknown => {
	try {
		const raw = localStorage.getItem(key);
		return raw === null ? null : JSON.parse(raw);
	} catch {
		return null;
	}
};

export const save = (key: string, value: unknown) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {}
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

export const loadName = () => parseName(load(STORAGE_KEYS.name));

export const loadBrushOptions = (): BrushOptions => {
	const stored = load(STORAGE_KEYS.brush);
	if (!isRecord(stored)) return INITIAL_BRUSH_OPTIONS;

	const { tool, color, size } = stored;

	return {
		tool:
			tool === "pencil" || tool === "eraser"
				? tool
				: INITIAL_BRUSH_OPTIONS.tool,
		color:
			typeof color === "string" && HEX_COLOR.test(color)
				? color
				: INITIAL_BRUSH_OPTIONS.color,
		size: isFiniteNumber(size)
			? clamp(Math.round(size), BRUSH_SIZE_BOUNDS.min, BRUSH_SIZE_BOUNDS.max)
			: INITIAL_BRUSH_OPTIONS.size,
	};
};

const centeredCamera = (): Camera => ({
	x: INITIAL_CAMERA.x - window.innerWidth / 2 / INITIAL_CAMERA.zoom,
	y: INITIAL_CAMERA.y - window.innerHeight / 2 / INITIAL_CAMERA.zoom,
	zoom: INITIAL_CAMERA.zoom,
});

export const loadCamera = (): Camera => {
	const stored = load(STORAGE_KEYS.camera);
	if (!isRecord(stored)) return centeredCamera();

	const { x, y, zoom } = stored;
	if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(zoom)) {
		return centeredCamera();
	}

	return {
		x,
		y,
		zoom: clamp(zoom, CAMERA_ZOOM_BOUNDS.min, CAMERA_ZOOM_BOUNDS.max),
	};
};
