import type { Point } from "@spot/shared";

export type Tool = "pencil" | "eraser";

export interface BrushOptions {
	tool: Tool;
	color: string;
	size: number;
}

export interface Bounds {
	min: number;
	max: number;
}

// x, y: world point at top left of screen
export interface Camera extends Point {
	zoom: number;
}

export interface Control {
	label: string;
	keys: string[][];
}
