import { useCallback, useEffect, useState } from "react";
import { Canvas, type CanvasProps } from "#/components/canvas";
import { NameBadge } from "#/components/ui/name-badge";
import { Toolbar, type ToolbarProps } from "#/components/ui/toolbar";
import { WelcomeDialog } from "#/components/ui/welcome-dialog";
import { useGlobalControls } from "#/hooks/use-global-controls";
import { useJoin } from "#/hooks/use-join";
import { STORAGE_KEYS } from "#/lib/options";
import { loadBrushOptions, save } from "#/lib/storage";
import type { BrushOptions, Tool } from "#/types";

export const App = () => {
	const {
		name,
		storedName,
		error: joinError,
		dialogOpen,
		renaming,
		submitName,
		startRenaming,
		cancelRenaming,
	} = useJoin();

	const [brushOptions, setBrushOptions] =
		useState<BrushOptions>(loadBrushOptions);

	useEffect(() => {
		save(STORAGE_KEYS.brush, brushOptions);
	}, [brushOptions]);

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
		<main className="relative h-dvh w-dvw overflow-hidden select-none [-webkit-touch-callout:none]">
			<WelcomeDialog
				open={dialogOpen}
				renaming={renaming}
				error={joinError}
				defaultName={name ?? storedName}
				onSubmit={submitName}
				onCancel={cancelRenaming}
			/>
			{name && <NameBadge name={name} onClick={startRenaming} />}
			<Canvas {...canvasProps} />
			<Toolbar {...toolbarProps} />
		</main>
	);
};
