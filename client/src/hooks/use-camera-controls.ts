import type { Point } from "@spot/shared";
import { type RefObject, useEffect } from "react";

export const useCameraControls = ({
	canvasRef,
	panBy,
	redraw,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	panBy: (delta: Point) => void;
	redraw: () => void;
}) => {
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handlePointerDown = (e: PointerEvent) => {
			if (e.button !== 1) return;

			e.preventDefault();
			canvas.setPointerCapture(e.pointerId);
		};

		const handlePointerMove = (e: PointerEvent) => {
			if ((e.buttons & 4) === 0) return;

			panBy({ x: e.movementX, y: e.movementY });
			redraw();
		};
		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerdown", handlePointerDown);

		return () => {
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [canvasRef, panBy, redraw]);
};
