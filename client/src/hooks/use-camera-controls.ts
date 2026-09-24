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

		const viewport = () => ({
			width: canvas.clientWidth,
			height: canvas.clientHeight,
		});

		const handlePointerDown = (e: PointerEvent) => {
			const middle = e.button === 1;
			const spaceLeft = e.button === 0 && spaceHeldRef.current;
			if (!middle && !spaceLeft) return;

			e.preventDefault();
			canvas.setPointerCapture(e.pointerId);
			panPointerId = e.pointerId;
			setIsPanning(true);
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (e.pointerId !== panPointerId) return;

			panBy({ x: e.movementX, y: e.movementY });
			clampToWorld(viewport());
			redraw();
		};

		const handlePointerUp = (e: PointerEvent) => {
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
