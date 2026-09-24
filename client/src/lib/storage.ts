import { parseName } from "@spot/shared";
import { clamp } from "#/lib/general";
import {
	BRUSH_SIZE_BOUNDS,
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

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

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

export const loadCamera = (): Camera => {
	const stored = load(STORAGE_KEYS.camera);
	if (!isRecord(stored)) return { ...INITIAL_CAMERA };

	const { x, y, zoom } = stored;
	if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(zoom)) {
		return { ...INITIAL_CAMERA };
	}

	return {
		x,
		y,
		zoom: clamp(zoom, CAMERA_ZOOM_BOUNDS.min, CAMERA_ZOOM_BOUNDS.max),
	};
};
