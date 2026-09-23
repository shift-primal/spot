import { useState } from "react";
import {
	BrushControls,
	type BrushControlsProps,
} from "#/components/BrushControls";
import { useDrawingCanvas } from "#/hooks/useDrawingCanvas";
import { clamp } from "#/lib/general";
import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from "#/lib/options";
import type { BrushOptions } from "#/types";

export const Canvas = () => {
	const [brushOptions, setBrushOptions] = useState<BrushOptions>({
		color: "#000fff",
		size: 5,
	});

	const { canvasRef, startDrawing, continueDrawing, stopDrawing } =
		useDrawingCanvas(brushOptions);

	const changeBrushSize = (action: "inc" | "dec") =>
		setBrushOptions({
			...brushOptions,
			size: clamp(
				brushOptions.size + (action === "inc" ? 1 : -1),
				MIN_BRUSH_SIZE,
				MAX_BRUSH_SIZE,
			),
		});

	const changeBrushColor = (color: string) =>
		setBrushOptions({ ...brushOptions, color });

	const brushProps: BrushControlsProps = {
		brushOptions,
		onSizeChange: changeBrushSize,
		onColorChange: changeBrushColor,
	};

	return (
		<>
			<canvas
				width="1000"
				height="500"
				className="border m-auto my-10"
				ref={canvasRef}
				onMouseDown={(e) => startDrawing(e)}
				onMouseMove={(e) => continueDrawing(e)}
				onMouseUp={() => stopDrawing()}
				onMouseLeave={() => stopDrawing()}
			></canvas>
			<BrushControls {...brushProps} />
		</>
	);
};
