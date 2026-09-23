import type { Coordinates, DrawPayload } from "@spot/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCoords, paintSegment } from "#/lib/canvas";
import { socket } from "#/socket";
import type { BrushOptions } from "#/types";

export const useDrawingCanvas = (brushOptions: BrushOptions) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const lastPointRef = useRef<Coordinates>({ x: 0, y: 0 });
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

		console.log("Canvas set up, ready to draw");
	}, []);

	// todo: setup socket
	useEffect(() => {
		const surface = getSurface();
		if (!surface) return;
		const { ctx } = surface;

		const onDraw = (payload: DrawPayload) => {
			paintSegment(ctx, payload);
		};

		socket.on("draw", onDraw);

		return () => {
			socket.off("draw", onDraw);
		};
	}, [getSurface]);

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		if (!canvasRef.current) return;

		const point = getCoords(e, canvasRef.current);
		lastPointRef.current = point;

		setIsDrawing(true);

		console.log("Started drawing at", point);
	};

	const draw = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		const surface = getSurface();
		if (!surface) return;
		const { canvas, ctx } = surface;

		if (!isDrawing) return;

		const point = getCoords(e, canvas);

		const payload: DrawPayload = {
			from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
			to: { x: point.x, y: point.y },
			color: brushOptions.brushColor,
			size: brushOptions.brushSize,
		};

		paintSegment(ctx, payload);

		socket.emit("draw", payload);

		lastPointRef.current = point;

		console.log("Drawing at", point);
	};

	const stopDrawing = () => {
		setIsDrawing(false);

		console.log("Stopped drawing");
	};

	const resetCanvas = () => {
		const surface = getSurface();
		if (!surface) return;
		const { canvas, ctx } = surface;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		console.log("Reset canvas");
	};

	return {
		canvasRef,
		startDrawing,
		draw,
		stopDrawing,
		resetCanvas,
		getSurface,
	};
};
