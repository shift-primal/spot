export interface Point {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Segment {
	from: Point;
	to: Point;
	color: string;
	size: number;
}

// a user's brush cursor, position in world coordinates
export interface Cursor {
	position: Point;
	color: string;
	size: number;
}

export interface ServerToClientEvents {
	"segment:draw": (segment: Segment) => void;
	"cursor:move": (id: string, cursor: Cursor) => void;
	"cursor:leave": (id: string) => void;
}

export interface ClientToServerEvents {
	"segment:draw": (segment: Segment) => void;
	"history:get": (callback: (history: Segment[]) => void) => void;
	"cursor:move": (cursor: Cursor) => void;
	"cursor:leave": () => void;
}

export const WORLD_SIZE: Size = {
	width: 10000,
	height: 10000,
};
