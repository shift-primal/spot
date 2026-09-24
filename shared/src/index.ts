export interface Point {
	x: number;
	y: number;
}

export interface Segment {
	from: Point;
	to: Point;
	color: string;
	size: number;
}

export interface ServerToClientEvents {
	"segment:draw": (segment: Segment) => void;
}

export interface ClientToServerEvents {
	"segment:draw": (segment: Segment) => void;
	"history:get": (callback: (history: Segment[]) => void) => void;
}

export const WORLD_WIDTH = 10000;
export const WORLD_HEIGHT = 10000;
