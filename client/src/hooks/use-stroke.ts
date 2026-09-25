import {
	MAX_SEGMENT_LENGTH,
	type Point,
	roundPoint,
	type Segment,
	WORLD_SIZE,
} from "@spot/shared";
import { type RefObject, useRef } from "react";
import { getPoint } from "#/lib/canvas";
import { clamp } from "#/lib/general";
import { TOUCH_STROKE_DELAY, TOUCH_STROKE_SLOP } from "#/lib/options";
import type { BrushOptions, Tool } from "#/types";

export const useStroke = ({
	canvasRef,
	brushOptions,
	screenToWorld,
	spaceHeld,
	onSegment,
	onStrokeEnd,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	brushOptions: BrushOptions;
	screenToWorld: (p: Point) => Point;
	spaceHeld: boolean;
	onSegment: (segment: Segment) => void;
	onStrokeEnd: (strokeId: number) => void;
}) => {
	const lastPointRef = useRef<Point>({ x: 0, y: 0 });
	const strokeToolRef = useRef<Tool>("pencil");
	const strokePointerRef = useRef<number | null>(null);
	const strokeIdRef = useRef(0);
	const strokeSentRef = useRef(false);
	const touchesRef = useRef(new Set<number>());
	const pendingRef = useRef<{
		start: Point;
		points: Point[];
		timer: ReturnType<typeof setTimeout>;
	} | null>(null);

	const toWorld = (screenPoint: Point) => {
		const point = screenToWorld(screenPoint);
		return roundPoint({
			x: clamp(point.x, 0, WORLD_SIZE.width),
			y: clamp(point.y, 0, WORLD_SIZE.height),
		});
	};

	const segmentTo = (point: Point) => {
		strokeSentRef.current = true;
		const start = lastPointRef.current;
		const pieces = Math.max(
			1,
			Math.ceil(
				Math.hypot(point.x - start.x, point.y - start.y) /
					(MAX_SEGMENT_LENGTH - 1),
			),
		);

		for (let i = 1; i <= pieces; i++) {
			const to =
				i === pieces
					? point
					: roundPoint({
							x: start.x + ((point.x - start.x) * i) / pieces,
							y: start.y + ((point.y - start.y) * i) / pieces,
						});
			onSegment({
				strokeId: strokeIdRef.current,
				from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
				to: { x: to.x, y: to.y },
				color: strokeToolRef.current === "eraser" ? "#fff" : brushOptions.color,
				size: brushOptions.size,
			});
			lastPointRef.current = to;
		}
	};

	const commitPending = () => {
		const pending = pendingRef.current;
		if (!pending) return;

		clearTimeout(pending.timer);
		pendingRef.current = null;

		const [first, ...rest] = pending.points;
		lastPointRef.current = first;
		segmentTo(first);
		for (const point of rest) segmentTo(point);
	};

	const discardPending = () => {
		if (pendingRef.current) clearTimeout(pendingRef.current.timer);
		pendingRef.current = null;
	};

	const endStroke = () => {
		if (strokeSentRef.current) onStrokeEnd(strokeIdRef.current);
		strokeSentRef.current = false;
		strokePointerRef.current = null;
	};

	const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;

		if (e.pointerType === "touch") {
			touchesRef.current.add(e.pointerId);
			if (touchesRef.current.size > 1) {
				discardPending();
				endStroke();
				return;
			}
		}

		if (strokePointerRef.current !== null) return;
		if (e.button === 1 || spaceHeld) return;
		if (e.button === 0 && e.shiftKey) return;

		const opposite = brushOptions.tool === "pencil" ? "eraser" : "pencil";
		strokeToolRef.current = e.button === 2 ? opposite : brushOptions.tool;
		strokePointerRef.current = e.pointerId;
		strokeIdRef.current += 1;
		e.currentTarget.setPointerCapture(e.pointerId);

		const screenPoint = getPoint(e, canvasRef.current);
		const point = toWorld(screenPoint);

		if (e.pointerType === "touch") {
			pendingRef.current = {
				start: screenPoint,
				points: [point],
				timer: setTimeout(commitPending, TOUCH_STROKE_DELAY),
			};
			return;
		}

		lastPointRef.current = point;
		segmentTo(point);
	};

	const continueDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;
		if (e.pointerId !== strokePointerRef.current) return;

		const screenPoint = getPoint(e, canvasRef.current);
		const point = toWorld(screenPoint);
		const pending = pendingRef.current;

		if (pending) {
			pending.points.push(point);
			const moved = Math.hypot(
				screenPoint.x - pending.start.x,
				screenPoint.y - pending.start.y,
			);
			if (moved > TOUCH_STROKE_SLOP) commitPending();
			return;
		}

		segmentTo(point);
	};

	const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		touchesRef.current.delete(e.pointerId);
		if (e.pointerId !== strokePointerRef.current) return;

		if (e.type === "pointercancel") discardPending();
		else commitPending();
		endStroke();
	};

	return { startDrawing, continueDrawing, stopDrawing };
};
