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

export interface Cursor {
	position: Point;
	color: string;
	size: number;
}

export interface RemoteCursor extends Cursor {
	name: string;
}

export interface JoinAuth {
	name: string;
}

export const NAME_MAX_LENGTH = 24;

export const parseName = (name: unknown): string | null => {
	if (typeof name !== "string") return null;
	const trimmed = name.trim();
	if (!trimmed || trimmed.length > NAME_MAX_LENGTH) return null;
	return trimmed;
};

export interface ServerToClientEvents {
	"segment:draw": (segment: Segment) => void;
	"cursor:move": (id: string, cursor: RemoteCursor) => void;
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
