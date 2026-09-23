import { useState } from "react";
import { Toolbar, type ToolbarProps } from "#/components/toolbar";
import { useDrawingCanvas } from "#/hooks/use-drawing-canvas";
import type { BrushOptions, Tool } from "#/types";

export const Canvas = () => {
	const [brushOptions, setBrushOptions] = useState<BrushOptions>({
		tool: "pencil",
		color: "#000",
		size: 5,
	});

	const { canvasRef, startDrawing, continueDrawing, stopDrawing } =
		useDrawingCanvas(brushOptions);

	const changeTool = (tool: Tool) =>
		setBrushOptions((prev) => ({ ...prev, tool }));

	const changeBrushSize = (px: number) =>
		setBrushOptions((prev) => ({
			...prev,
			size: px,
		}));

	const changeBrushColor = (color: string) =>
		setBrushOptions((prev) => ({ ...prev, color }));

	const brushProps: ToolbarProps = {
		brushOptions,
		onToolChange: changeTool,
		onSizeChange: changeBrushSize,
		onColorChange: changeBrushColor,
	};

	return (
		<>
			<canvas
				width="1000"
				height="500"
				className="border m-auto my-10 touch-none"
				ref={canvasRef}
				onPointerDown={startDrawing}
				onPointerMove={continueDrawing}
				onPointerUp={stopDrawing}
				onPointerCancel={stopDrawing}
				onContextMenu={(e) => e.preventDefault()}
			></canvas>
			<Toolbar {...brushProps} />
		</>
	);
};
