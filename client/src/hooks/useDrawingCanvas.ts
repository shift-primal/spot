import { useEffect, useRef, useState } from "react";
import { getCoords } from "#/lib/canvas";
import { socket } from "#/socket";
import type { BrushOptions, Coordinates, DrawPayload } from "#/types";

export const useDrawingCanvas = (brushOptions: BrushOptions) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const lastPointRef = useRef<Coordinates>({ x: 0, y: 0 });
	const [isDrawing, setIsDrawing] = useState<boolean>(false);

	// setup canvas
	useEffect(() => {
		const ctx = canvasRef.current.getContext("2d");
		ctx.lineJoin = "round";
		ctx.lineCap = "round";

		ctxRef.current = ctx;

		console.log("Canvas set up, ready to draw");
	}, []);

	// todo: setup socket
	useEffect(() => {}, []);

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		const point = getCoords(e, canvasRef.current);
		lastPointRef.current = point;

		setIsDrawing(true);

		console.log("Started drawing at", point);
	};

	const draw = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
		const ctx = ctxRef.current;

		if (!isDrawing || !ctx || !lastPointRef.current) return;

		ctx.lineWidth = brushOptions.brushSize;
		ctx.strokeStyle = brushOptions.brushColor;

		const point = getCoords(e, canvasRef.current);

		ctx.beginPath();
		ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();

		const payload: DrawPayload = {
			from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
			to: { x: point.x, y: point.y },
			color: brushOptions.brushColor,
			size: brushOptions.brushSize,
		};

		socket.emit("draw", payload);

		lastPointRef.current = point;

		console.log("Drawing at", point);
	};

	const stopDrawing = () => {
		setIsDrawing(false);

		console.log("Stopped drawing");
	};

	const resetCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		console.log("Reset canvas");
	};

	return { canvasRef, startDrawing, draw, stopDrawing, resetCanvas };
};
