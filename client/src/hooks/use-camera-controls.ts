import type { Point } from "@spot/shared";
import { type RefObject, useEffect, useRef, useState } from "react";
import { getPoint } from "#/lib/canvas";
import { ZOOM_SENSITIVITY } from "#/lib/options";

export const useCameraControls = ({
	canvasRef,
	spaceHeld,
	panBy,
	zoomAt,
	clampToWorld,
	redraw,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	spaceHeld: boolean;
	panBy: (delta: Point) => void;
	zoomAt: (screenPoint: Point, factor: number) => void;
	clampToWorld: (viewport: { width: number; height: number }) => void;
	redraw: () => void;
}) => {
	const [isPanning, setIsPanning] = useState(false);

	const spaceHeldRef = useRef(spaceHeld);
	spaceHeldRef.current = spaceHeld;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let panPointerId: number | null = null;
		const touches = new Map<number, Point>();
		let pinch: { mid: Point; dist: number } | null = null;

		const measurePinch = () => {
			if (touches.size < 2) return null;
			const [a, b] = touches.values();
			return {
				mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
				dist: Math.hypot(a.x - b.x, a.y - b.y),
			};
		};

		const handleTouchDown = (e: PointerEvent) => {
			touches.set(e.pointerId, getPoint(e, canvas));
			pinch = measurePinch();
			if (pinch) {
				canvas.setPointerCapture(e.pointerId);
				setIsPanning(true);
			}
		};

		const handleTouchMove = (e: PointerEvent) => {
			if (!touches.has(e.pointerId)) return;
			touches.set(e.pointerId, getPoint(e, canvas));

			const next = measurePinch();
			if (!pinch || !next) return;

			panBy({ x: next.mid.x - pinch.mid.x, y: next.mid.y - pinch.mid.y });
			if (pinch.dist > 0) zoomAt(next.mid, next.dist / pinch.dist);
			clampToWorld(viewport());
			redraw();
			pinch = next;
		};

		const handleTouchUp = (e: PointerEvent) => {
			if (!touches.delete(e.pointerId)) return;
			pinch = measurePinch();
			if (!pinch) setIsPanning(false);
		};

		const viewport = () => ({
			width: canvas.clientWidth,
			height: canvas.clientHeight,
		});

		const handlePointerDown = (e: PointerEvent) => {
			if (e.pointerType === "touch") return handleTouchDown(e);

			const middle = e.button === 1;
			const spaceLeft = e.button === 0 && spaceHeldRef.current;
			if (!middle && !spaceLeft) return;

			e.preventDefault();
			canvas.setPointerCapture(e.pointerId);
			panPointerId = e.pointerId;
			setIsPanning(true);
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (e.pointerType === "touch") return handleTouchMove(e);
			if (e.pointerId !== panPointerId) return;

			panBy({ x: e.movementX, y: e.movementY });
			clampToWorld(viewport());
			redraw();
		};

		const handlePointerUp = (e: PointerEvent) => {
			if (e.pointerType === "touch") return handleTouchUp(e);
			if (e.pointerId !== panPointerId) return;

			panPointerId = null;
			setIsPanning(false);
		};

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();

			const screenPoint: Point = getPoint(e, canvas);

			const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);

			zoomAt(screenPoint, factor);
			clampToWorld(viewport());
			redraw();
		};

		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("pointercancel", handlePointerUp);
		canvas.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointerup", handlePointerUp);
			canvas.removeEventListener("pointercancel", handlePointerUp);
			canvas.removeEventListener("wheel", handleWheel);
		};
	}, [canvasRef, panBy, zoomAt, clampToWorld, redraw]);

	return { isPanning };
};
