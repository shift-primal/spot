import { PaintCursor } from "#/components/ui/paint-cursor";
import { useDrawingCanvas } from "#/hooks/use-drawing-canvas";
import type { BrushOptions } from "#/types";

export interface CanvasProps {
	brushOptions: BrushOptions;
}

export const Canvas = ({ brushOptions }: CanvasProps) => {
	const { canvasRef, startDrawing, continueDrawing, stopDrawing } =
		useDrawingCanvas(brushOptions);

	return (
		<>
			<PaintCursor brushOptions={brushOptions} canvasRef={canvasRef} />
			<canvas
				className="touch-none cursor-none h-full w-full"
				ref={canvasRef}
				onPointerDown={startDrawing}
				onPointerMove={continueDrawing}
				onPointerUp={stopDrawing}
				onPointerCancel={stopDrawing}
				onContextMenu={(e) => e.preventDefault()}
			></canvas>
		</>
	);
};
