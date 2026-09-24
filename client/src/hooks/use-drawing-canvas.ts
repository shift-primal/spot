import type { Segment } from "@spot/shared";
import { useCallback } from "react";
import { useCanvasSurface } from "#/hooks/use-canvas-surface";
import { useSharedSegments } from "#/hooks/use-shared-segments";
import { useStroke } from "#/hooks/use-stroke";
import { paintSegment } from "#/lib/canvas";
import type { BrushOptions } from "#/types";

export const useDrawingCanvas = (brushOptions: BrushOptions) => {
	const { canvasRef, getSurface } = useCanvasSurface();

	const paintSegments = useCallback(
		(segments: Segment[]) => {
			const surface = getSurface();
			if (!surface) return;

			for (const segment of segments) {
				paintSegment(surface.ctx, segment);
			}
		},
		[getSurface],
	);

	const { sendSegment } = useSharedSegments(paintSegments);

	const { startDrawing, continueDrawing, stopDrawing } = useStroke({
		canvasRef,
		brushOptions,
		onSegment: (segment) => {
			paintSegments([segment]);
			sendSegment(segment);
		},
	});

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
