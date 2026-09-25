import { cn } from "cn";
import { Minimap } from "#/components/ui/minimap";
import { PaintCursor } from "#/components/ui/paint-cursor";
import { RemoteCursors } from "#/components/ui/remote-cursors";
import { useDrawingCanvas } from "#/hooks/use-drawing-canvas";
import type { BrushOptions } from "#/types";

export interface CanvasProps {
	brushOptions: BrushOptions;
	spaceHeld: boolean;
	onSizeChange: (size: number) => void;
}

export const Canvas = ({
	brushOptions,
	spaceHeld,
	onSizeChange,
}: CanvasProps) => {
	const {
		canvasRef,
		attachCanvas,
		attachMinimap,
		zoom,
		isPanning,
		resizeAnchor,
		cursors,
		cursorLayerRef,
		startDrawing,
		continueDrawing,
		stopDrawing,
	} = useDrawingCanvas(brushOptions, spaceHeld, onSizeChange);

	return (
		<>
			<RemoteCursors cursors={cursors} layerRef={cursorLayerRef} />
			<PaintCursor
				brushOptions={brushOptions}
				canvasRef={canvasRef}
				zoom={zoom}
				hidden={spaceHeld || isPanning}
				anchor={resizeAnchor}
				label={resizeAnchor && `${brushOptions.size}px`}
			/>
			<canvas
				className={cn(
					"touch-none h-full w-full",
					isPanning
						? "cursor-grabbing"
						: spaceHeld
							? "cursor-grab"
							: "cursor-none",
				)}
				ref={attachCanvas}
				onPointerDown={startDrawing}
				onPointerMove={continueDrawing}
				onPointerUp={stopDrawing}
				onPointerCancel={stopDrawing}
				onContextMenu={(e) => e.preventDefault()}
			></canvas>
			<Minimap canvasRef={attachMinimap} />
		</>
	);
};
