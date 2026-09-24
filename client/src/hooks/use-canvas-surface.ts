import { useCallback, useEffect, useRef } from "react";

export interface Surface {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
}

export const useCanvasSurface = (onResize: (surface: Surface) => void) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	const getSurface = useCallback((): Surface | null => {
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

			// resizing clears the bitmap and resets context state
			canvas.width = width;
			canvas.height = height;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";

			onResize({ canvas, ctx });
		};

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);

		return () => observer.disconnect();
	}, [onResize]);

	return { canvasRef, getSurface };
};
