import type { Point } from "@spot/shared";
import { type RefObject, useEffect } from "react";
import { getPoint } from "#/lib/canvas";

export const useCameraControls = ({
	canvasRef,
	panBy,
	zoomAt,
	clampToWorld,
	redraw,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	panBy: (delta: Point) => void;
	zoomAt: (screenPoint: Point, factor: number) => void;
	clampToWorld: (viewport: { width: number; height: number }) => void;
	redraw: () => void;
}) => {
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const viewport = () => ({
			width: canvas.clientWidth,
			height: canvas.clientHeight,
		});

		const handlePointerDown = (e: PointerEvent) => {
			if (e.button !== 1) return;

			e.preventDefault();
			canvas.setPointerCapture(e.pointerId);
		};

		const handlePointerMove = (e: PointerEvent) => {
			if ((e.buttons & 4) === 0) return;

			panBy({ x: e.movementX, y: e.movementY });
			clampToWorld(viewport());
			redraw();
		};

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();

			const screenPoint: Point = getPoint(e, canvas);

			const factor = Math.exp(-e.deltaY * 0.001);

			zoomAt(screenPoint, factor);
			clampToWorld(viewport());
			redraw();
		};

		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("wheel", handleWheel);
		};
	}, [canvasRef, panBy, zoomAt, clampToWorld, redraw]);
};
