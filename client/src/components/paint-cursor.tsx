import type { Point } from "@spot/shared";
import { type RefObject, useEffect, useState } from "react";
import type { BrushOptions } from "#/types";

export const PaintCursor = ({
	brushOptions,
	canvasRef,
}: {
	brushOptions: BrushOptions;
	canvasRef: RefObject<HTMLCanvasElement | null>;
}) => {
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

	if (!position) return null;

	const erasing = (brushOptions.tool === "eraser") !== rightHeld;

	return (
		<div
			className="rounded-full z-999 fixed -translate-1/2 pointer-events-none outline -outline-offset-1"
			style={{
				backgroundColor: erasing ? "#fff" : brushOptions.color,
				height: brushOptions.size,
				width: brushOptions.size,
				left: `${position.x}px`,
				top: `${position.y}px`,
			}}
		/>
	);
};
