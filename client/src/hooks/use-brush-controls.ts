import type { Point } from "@spot/shared";
import { type RefObject, useEffect, useRef, useState } from "react";
import { clamp } from "#/lib/general";
import { BRUSH_SIZE_BOUNDS, RESIZE_SENSITIVITY } from "#/lib/options";

export const useBrushControls = ({
	canvasRef,
	size,
	onSizeChange,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	size: number;
	onSizeChange: (size: number) => void;
}) => {
	const [resizeAnchor, setResizeAnchor] = useState<Point | null>(null);

	const sizeRef = useRef(size);
	sizeRef.current = size;
	const onSizeChangeRef = useRef(onSizeChange);
	onSizeChangeRef.current = onSizeChange;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		let resize: {
			pointerId: number;
			startX: number;
			startSize: number;
		} | null = null;

		const handlePointerDown = (e: PointerEvent) => {
			if (e.button !== 0 || !e.shiftKey) return;

			e.preventDefault();
			canvas.setPointerCapture(e.pointerId);
			resize = {
				pointerId: e.pointerId,
				startX: e.clientX,
				startSize: sizeRef.current,
			};
			setResizeAnchor({ x: e.clientX, y: e.clientY });
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (e.pointerId !== resize?.pointerId) return;

			const dx = e.clientX - resize.startX;
			const next = clamp(
				Math.round(resize.startSize + dx * RESIZE_SENSITIVITY),
				BRUSH_SIZE_BOUNDS.min,
				BRUSH_SIZE_BOUNDS.max,
			);
			if (next !== sizeRef.current) onSizeChangeRef.current(next);
		};

		const handlePointerUp = (e: PointerEvent) => {
			if (e.pointerId !== resize?.pointerId) return;

			resize = null;
			setResizeAnchor(null);
		};

		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("pointercancel", handlePointerUp);

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerup", handlePointerUp);
			canvas.removeEventListener("pointercancel", handlePointerUp);
		};
	}, [canvasRef]);

	return { resizeAnchor };
};
