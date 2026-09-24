import type { Point } from "@spot/shared";
import type { RefObject } from "react";
import { usePaintCursor } from "#/hooks/use-paint-cursor";
import type { BrushOptions } from "#/types";

export const PaintCursor = ({
	brushOptions,
	canvasRef,
	zoom,
	hidden,
	anchor,
}: {
	brushOptions: BrushOptions;
	canvasRef: RefObject<HTMLCanvasElement | null>;
	zoom: number;
	hidden: boolean;
	anchor: Point | null;
}) => {
	const { position, erasing } = usePaintCursor(canvasRef, brushOptions.tool);

	const at = anchor ?? position;
	if (!at || hidden) return null;

	const size = brushOptions.size * zoom;

	return (
		// z = 40, toolbar (50) should be over cursor
		<div
			className="rounded-full z-40 fixed -translate-1/2 pointer-events-none outline -outline-offset-1"
			style={{
				backgroundColor: erasing ? "#fff" : brushOptions.color,
				height: size,
				width: size,
				left: `${at.x}px`,
				top: `${at.y}px`,
			}}
		/>
	);
};
