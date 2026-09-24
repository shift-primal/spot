import type { Point, Segment } from "@spot/shared";
import { type RefObject, useRef, useState } from "react";
import { getPoint } from "#/lib/canvas";
import type { BrushOptions, Tool } from "#/types";

export const useStroke = ({
	canvasRef,
	brushOptions,
	screenToWorld,
	onSegment,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	brushOptions: BrushOptions;
	screenToWorld: (p: Point) => Point;
	onSegment: (segment: Segment) => void;
}) => {
	const lastPointRef = useRef<Point>({ x: 0, y: 0 });
	const strokeToolRef = useRef<Tool>("pencil");
	const [isDrawing, setIsDrawing] = useState<boolean>(false);

	const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;
		if (e.button === 1) return;

		const opposite = brushOptions.tool === "pencil" ? "eraser" : "pencil";
		strokeToolRef.current = e.button === 2 ? opposite : brushOptions.tool;
		lastPointRef.current = screenToWorld(getPoint(e, canvasRef.current));
		e.currentTarget.setPointerCapture(e.pointerId);
		setIsDrawing(true);
	};

	const continueDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;
		if (!isDrawing) return;

		const point = screenToWorld(getPoint(e, canvasRef.current));

		onSegment({
			from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
			to: { x: point.x, y: point.y },
			color: strokeToolRef.current === "eraser" ? "#fff" : brushOptions.color,
			size: brushOptions.size,
		});

		lastPointRef.current = point;
	};

	const stopDrawing = () => setIsDrawing(false);

	return { startDrawing, continueDrawing, stopDrawing };
};
