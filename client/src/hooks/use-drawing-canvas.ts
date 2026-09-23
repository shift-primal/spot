import type { Point, Segment } from "@spot/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPoint, paintSegment } from "#/lib/canvas";
import { socket } from "#/socket";
import type { BrushOptions, Tool } from "#/types";

export const useDrawingCanvas = (brushOptions: BrushOptions) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const lastPointRef = useRef<Point>({ x: 0, y: 0 });
	const strokeToolRef = useRef<Tool>("pencil");
	const [isDrawing, setIsDrawing] = useState<boolean>(false);

	const getSurface = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return null;
		return { canvas, ctx };
	}, []);

	// setup canvas
	useEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");
		if (!ctx) return;

		ctx.lineJoin = "round";
		ctx.lineCap = "round";

		ctxRef.current = ctx;
	}, []);

	// setup socket
	useEffect(() => {
		const surface = getSurface();
		if (!surface) return;
		const { ctx } = surface;

		socket.emit("history:get", (history) => {
			for (const segment of history) {
				paintSegment(ctx, segment);
			}
		});

		const onRemoteSegment = (segment: Segment) => {
			paintSegment(ctx, segment);
		};

		socket.on("segment:draw", onRemoteSegment);

		return () => {
			socket.off("segment:draw", onRemoteSegment);
		};
	}, [getSurface]);

	const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current) return;
		if (e.button === 1) return;

		const opposite = brushOptions.tool === "pencil" ? "eraser" : "pencil";
		strokeToolRef.current = e.button === 2 ? opposite : brushOptions.tool;
		lastPointRef.current = getPoint(e, canvasRef.current);
		e.currentTarget.setPointerCapture(e.pointerId);
		setIsDrawing(true);
	};

	const continueDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const surface = getSurface();
		if (!surface) return;
		const { canvas, ctx } = surface;

		if (!isDrawing) return;

		const point = getPoint(e, canvas);

		const segment: Segment = {
			from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
			to: { x: point.x, y: point.y },
			color: strokeToolRef.current === "eraser" ? "#fff" : brushOptions.color,
			size: brushOptions.size,
		};

		paintSegment(ctx, segment);

		socket.emit("segment:draw", segment);

		lastPointRef.current = point;
	};

	const stopDrawing = () => setIsDrawing(false);

	const resetCanvas = () => {
		const surface = getSurface();
		if (!surface) return;
		const { canvas, ctx } = surface;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	return {
		canvasRef,
		startDrawing,
		continueDrawing,
		stopDrawing,
		resetCanvas,
	};
};
