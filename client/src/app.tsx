import { useCallback, useState } from "react";
import { Canvas, type CanvasProps } from "#/components/canvas";
import { Toolbar, type ToolbarProps } from "#/components/ui/toolbar";
import { WelcomeDialog } from "#/components/ui/welcome-dialog";
import { useGlobalControls } from "#/hooks/use-global-controls";
import { useJoin } from "#/hooks/use-join";
import { INITIAL_BRUSH_OPTIONS } from "#/lib/options";
import type { BrushOptions, Tool } from "#/types";

export const App = () => {
	const { joined, error: joinError, join } = useJoin();

	const [brushOptions, setBrushOptions] = useState<BrushOptions>(
		INITIAL_BRUSH_OPTIONS,
	);

	const changeTool = useCallback(
		(tool: Tool) => setBrushOptions((prev) => ({ ...prev, tool })),
		[],
	);

	const [colorPickerOpen, setColorPickerOpen] = useState(false);

	const toggleColorPicker = useCallback(
		() => setColorPickerOpen((open) => !open),
		[],
	);

	const { spaceHeld } = useGlobalControls({
		onToolChange: changeTool,
		onColorPickerToggle: toggleColorPicker,
	});

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
		colorPickerOpen,
		onColorPickerOpenChange: setColorPickerOpen,
	};

	return (
		<main className="relative h-dvh w-dvw overflow-hidden">
			<WelcomeDialog open={!joined} error={joinError} onJoin={join} />
			<Canvas {...canvasProps} />
			<Toolbar {...toolbarProps} />
		</main>
	);
};
