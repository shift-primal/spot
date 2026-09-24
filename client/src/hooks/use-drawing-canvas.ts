import { type Segment, WORLD_HEIGHT, WORLD_WIDTH } from "@spot/shared";
import { useCallback, useRef } from "react";
import { useBrushControls } from "#/hooks/use-brush-controls";
import { useCamera } from "#/hooks/use-camera";
import { useCameraControls } from "#/hooks/use-camera-controls";
import { type Surface, useCanvasSurface } from "#/hooks/use-canvas-surface";
import { useSharedSegments } from "#/hooks/use-shared-segments";
import { useStroke } from "#/hooks/use-stroke";
import { paintSegment } from "#/lib/canvas";
import type { BrushOptions } from "#/types";

export const useDrawingCanvas = (
	brushOptions: BrushOptions,
	spaceHeld: boolean,
	onSizeChange: (size: number) => void,
) => {
	const { cameraRef, zoom, screenToWorld, panBy, clampToWorld, zoomAt } =
		useCamera();
	const segmentsRef = useRef<Segment[]>([]);

	const drawScene = useCallback(
		({ canvas, ctx }: Surface) => {
			const { x, y, zoom } = cameraRef.current;
			const dpr = window.devicePixelRatio || 1;

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.setTransform(
				dpr * zoom,
				0,
				0,
				dpr * zoom,
				-x * dpr * zoom,
				-y * dpr * zoom,
			);
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

			for (const segment of segmentsRef.current) {
				paintSegment(ctx, segment);
			}
		},
		[cameraRef],
	);

	const { canvasRef, getSurface } = useCanvasSurface(drawScene);

	const redraw = useCallback(() => {
		const surface = getSurface();
		if (surface) drawScene(surface);
	}, [getSurface, drawScene]);

	const { isPanning } = useCameraControls({
		canvasRef,
		spaceHeld,
		panBy,
		zoomAt,
		clampToWorld,
		redraw,
	});

	const { resizeAnchor } = useBrushControls({
		canvasRef,
		size: brushOptions.size,
		onSizeChange,
	});

	const paintSegments = useCallback(
		(segments: Segment[]) => {
			const surface = getSurface();

			for (const segment of segments) {
				segmentsRef.current.push(segment);
				if (surface) paintSegment(surface.ctx, segment);
			}
		},
		[getSurface],
	);

	const { sendSegment } = useSharedSegments(paintSegments);

	const { startDrawing, continueDrawing, stopDrawing } = useStroke({
		canvasRef,
		brushOptions,
		screenToWorld,
		spaceHeld,
		onSegment: (segment) => {
			paintSegments([segment]);
			sendSegment(segment);
		},
	});

	const resetCanvas = () => {
		segmentsRef.current = [];
		redraw();
	};

	return {
		canvasRef,
		cameraRef,
		zoom,
		isPanning,
		resizeAnchor,
		redraw,
		startDrawing,
		continueDrawing,
		stopDrawing,
		resetCanvas,
	};
};
