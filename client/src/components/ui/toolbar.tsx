import { ColorPicker } from "#/components/toolbar/color-picker";
import { SizeSlider } from "#/components/toolbar/size-slider";
import { ToolSelection } from "#/components/toolbar/tool-selection";

import type { BrushOptions, Tool } from "#/types";

export interface ToolbarProps {
	brushOptions: BrushOptions;
	onToolChange: (tool: Tool) => void;
	onSizeChange: (px: number) => void;
	onColorChange: (color: string) => void;
}

export const Toolbar = ({
	brushOptions,
	onToolChange,
	onSizeChange,
	onColorChange,
}: ToolbarProps) => {
	const toolSelectionProps = {
		brushOptions,
		onToolChange,
	};

	const sizeSliderProps = {
		brushOptions,
		onSizeChange,
	};

	const colorPickerProps = {
		brushOptions,
		onColorChange,
	};

	return (
		// z = 50, toolbar should be over cursor (40)
		<div className="flex gap-2 items-center absolute bottom-4 left-1/2 -translate-x-1/2 border py-2 px-4 rounded-full bg-background z-50">
			<ToolSelection {...toolSelectionProps} />
			<SizeSlider {...sizeSliderProps} />
			<ColorPicker {...colorPickerProps} />
		</div>
	);
};
