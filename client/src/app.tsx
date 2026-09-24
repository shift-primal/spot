import { useCallback, useState } from "react";
import { Canvas, type CanvasProps } from "#/components/canvas";
import { Toolbar, type ToolbarProps } from "#/components/ui/toolbar";
import { useGlobalControls } from "#/hooks/use-global-controls";
import { INITIAL_BRUSH_OPTIONS } from "#/lib/options";
import type { BrushOptions, Tool } from "#/types";

export const App = () => {
	const [brushOptions, setBrushOptions] = useState<BrushOptions>(
		INITIAL_BRUSH_OPTIONS,
	);

	const changeTool = useCallback(
		(tool: Tool) => setBrushOptions((prev) => ({ ...prev, tool })),
		[],
	);

	const { spaceHeld } = useGlobalControls({ onToolChange: changeTool });

	const changeBrushSize = (px: number) =>
		setBrushOptions((prev) => ({
			...prev,
			size: px,
		}));

	const changeBrushColor = (color: string) =>
		setBrushOptions((prev) => ({ ...prev, color }));

	const canvasProps: CanvasProps = {
		brushOptions,
		spaceHeld,
		onSizeChange: changeBrushSize,
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
