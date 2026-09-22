export interface Coordinates {
	x: number;
	y: number;
}

export interface BrushOptions {
	brushColor: string;
	brushSize: number;
}

export interface DrawPayload {
	from: Coordinates;
	to: Coordinates;
	color: string;
	size: number;
}
