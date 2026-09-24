import type { Point } from "@spot/shared";
import { type RefObject, useEffect, useState } from "react";
import type { Tool } from "#/types";

export const usePaintCursor = (
	canvasRef: RefObject<HTMLCanvasElement | null>,
	tool: Tool,
) => {
	const [position, setPosition] = useState<Point | null>(null);
	const [rightHeld, setRightHeld] = useState(false);

	useEffect(() => {
		const handlePointer = (e: PointerEvent) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			setRightHeld((e.buttons & 2) !== 0);

			const rect = canvas.getBoundingClientRect();
			const isInside =
				e.clientX >= rect.left &&
				e.clientX <= rect.right &&
				e.clientY >= rect.top &&
				e.clientY <= rect.bottom;

			setPosition(isInside ? { x: e.clientX, y: e.clientY } : null);
		};

		const hide = () => setPosition(null);

		window.addEventListener("pointermove", handlePointer);
		window.addEventListener("pointerdown", handlePointer);
		window.addEventListener("pointerup", handlePointer);
		document.documentElement.addEventListener("pointerleave", hide);

		return () => {
			window.removeEventListener("pointermove", handlePointer);
			window.removeEventListener("pointerdown", handlePointer);
			window.removeEventListener("pointerup", handlePointer);
			document.documentElement.removeEventListener("pointerleave", hide);
		};
	}, [canvasRef]);

	const erasing = (tool === "eraser") !== rightHeld;

	return { position, erasing };
};
