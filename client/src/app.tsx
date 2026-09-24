import { useState } from "react";
import { Canvas, type CanvasProps } from "#/components/canvas";
import { Toolbar, type ToolbarProps } from "#/components/ui/toolbar";
import type { BrushOptions, Tool } from "#/types";

export const App = () => {
	const [brushOptions, setBrushOptions] = useState<BrushOptions>({
		tool: "pencil",
		color: "#000",
		size: 5,
	});

	const changeTool = (tool: Tool) =>
		setBrushOptions((prev) => ({ ...prev, tool }));

	const changeBrushSize = (px: number) =>
		setBrushOptions((prev) => ({
			...prev,
			size: px,
		}));

	const changeBrushColor = (color: string) =>
		setBrushOptions((prev) => ({ ...prev, color }));

	const canvasProps: CanvasProps = {
		brushOptions,
	};

	const toolbarProps: ToolbarProps = {
		brushOptions,
		onToolChange: changeTool,
		onSizeChange: changeBrushSize,
		onColorChange: changeBrushColor,
	};

	return (
		<main className="relative h-dvh w-dvw overflow-hidden">
			<Canvas {...canvasProps} />
			<Toolbar {...toolbarProps} />
		</main>
	);
};
