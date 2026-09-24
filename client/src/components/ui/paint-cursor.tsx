import type { RefObject } from "react";
import { usePaintCursor } from "#/hooks/use-paint-cursor";
import type { BrushOptions } from "#/types";

export const PaintCursor = ({
	brushOptions,
	canvasRef,
}: {
	brushOptions: BrushOptions;
	canvasRef: RefObject<HTMLCanvasElement | null>;
}) => {
	const { position, erasing } = usePaintCursor(canvasRef, brushOptions.tool);

	if (!position) return null;

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
