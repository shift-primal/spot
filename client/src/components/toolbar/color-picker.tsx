import { HexColorPicker } from "react-colorful";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/shadcn/popover";
import { ColorTrigger } from "#/components/toolbar/color-trigger";
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
