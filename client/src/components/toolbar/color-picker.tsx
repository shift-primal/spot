import { HexColorPicker } from "react-colorful";
import { ColorTrigger } from "#/components/toolbar/color-trigger";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import type { BrushOptions } from "#/types";

export const ColorPicker = ({
	brushOptions,
	onColorChange,
}: {
	brushOptions: BrushOptions;
	onColorChange: (color: string) => void;
}) => (
	<Popover>
		<PopoverTrigger>
			<ColorTrigger color={brushOptions.color} />
		</PopoverTrigger>
		<PopoverContent>
			<HexColorPicker
				color={brushOptions.color}
				onChange={(color) => onColorChange(color)}
			/>
		</PopoverContent>
	</Popover>
);
