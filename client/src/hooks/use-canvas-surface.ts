import { useCallback, useEffect, useRef } from "react";

export const useCanvasSurface = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	const getSurface = useCallback(() => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return null;
		return { canvas, ctx };
	}, []);

	// setup canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctxRef.current = ctx;

		const resize = () => {
			const dpr = window.devicePixelRatio || 1;
			const width = Math.round(canvas.clientWidth * dpr);
			const height = Math.round(canvas.clientHeight * dpr);
			if (canvas.width === width && canvas.height === height) return;

			const snapshot = document.createElement("canvas");
			snapshot.width = canvas.width;
			snapshot.height = canvas.height;
			snapshot.getContext("2d")?.drawImage(canvas, 0, 0);

			canvas.width = width;
			canvas.height = height;
			ctx.drawImage(snapshot, 0, 0);

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
		};

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);

		return () => observer.disconnect();
	}, []);

	return { canvasRef, getSurface };
};
