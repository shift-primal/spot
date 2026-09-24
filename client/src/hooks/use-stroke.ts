import type { Point, Segment } from "@spot/shared";
import { type RefObject, useRef } from "react";
import { getPoint } from "#/lib/canvas";
import { TOUCH_STROKE_DELAY, TOUCH_STROKE_SLOP } from "#/lib/options";
import type { BrushOptions, Tool } from "#/types";

export const useStroke = ({
	canvasRef,
	brushOptions,
	screenToWorld,
	spaceHeld,
	onSegment,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	brushOptions: BrushOptions;
	screenToWorld: (p: Point) => Point;
	spaceHeld: boolean;
	onSegment: (segment: Segment) => void;
}) => {
	const lastPointRef = useRef<Point>({ x: 0, y: 0 });
	const strokeToolRef = useRef<Tool>("pencil");
	const strokePointerRef = useRef<number | null>(null);
	const touchesRef = useRef(new Set<number>());
	const pendingRef = useRef<{
		start: Point;
		points: Point[];
		timer: ReturnType<typeof setTimeout>;
	} | null>(null);

	const segmentTo = (point: Point) => {
		onSegment({
			from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
			to: { x: point.x, y: point.y },
			color: strokeToolRef.current === "eraser" ? "#fff" : brushOptions.color,
			size: brushOptions.size,
		});
		lastPointRef.current = point;
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

	const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;

		if (e.pointerType === "touch") {
			touchesRef.current.add(e.pointerId);
			if (touchesRef.current.size > 1) {
				discardPending();
				strokePointerRef.current = null;
				return;
			}
		}

		if (strokePointerRef.current !== null) return;
		if (e.button === 1 || spaceHeld) return;
		if (e.button === 0 && e.shiftKey) return;

		const opposite = brushOptions.tool === "pencil" ? "eraser" : "pencil";
		strokeToolRef.current = e.button === 2 ? opposite : brushOptions.tool;
		strokePointerRef.current = e.pointerId;
		e.currentTarget.setPointerCapture(e.pointerId);

		const screenPoint = getPoint(e, canvasRef.current);
		const point = screenToWorld(screenPoint);

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
		const point = screenToWorld(screenPoint);
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
		strokePointerRef.current = null;
	};

	return { startDrawing, continueDrawing, stopDrawing };
};
