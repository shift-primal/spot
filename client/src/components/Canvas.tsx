import { useState } from "react";
import {
	BrushControls,
	type BrushControlsProps,
} from "#/components/BrushControls";
import { useDrawingCanvas } from "#/hooks/useDrawingCanvas";
import type { BrushOptions } from "#/types";

export const Canvas = () => {
	const [brushOptions, setBrushOptions] = useState<BrushOptions>({
		brushColor: "#000fff",
		brushSize: 5,
	});

	const { canvasRef, startDrawing, draw, stopDrawing, resetCanvas } =
		useDrawingCanvas(brushOptions);

	const changeBrushSize = (action: "inc" | "dec") =>
		setBrushOptions({
			...brushOptions,
			brushSize: brushOptions.brushSize + (action === "inc" ? 1 : -1),
		});

	const changeBrushColor = (color: string) =>
		setBrushOptions({ ...brushOptions, brushColor: color });

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
				onMouseMove={(e) => draw(e)}
				onMouseUp={() => stopDrawing()}
				onMouseLeave={() => stopDrawing()}
			></canvas>
			<BrushControls {...brushProps} />
			<button
				type="button"
				className="border px-4 py-0.5 cursor-pointer bg-red-200 active:bg-red-400 mb-5"
				onClick={resetCanvas}
			>
				Reset
			</button>
		</>
	);
};
