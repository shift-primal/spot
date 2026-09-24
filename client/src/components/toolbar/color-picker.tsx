import { HexColorPicker } from "react-colorful";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/shadcn/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/shadcn/tooltip";
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
		<Tooltip>
			<TooltipTrigger
				render={
					<PopoverTrigger
						className="size-6 shrink-0 rounded-full"
						aria-label="Change color"
					/>
				}
			>
				<ColorTrigger color={brushOptions.color} />
			</TooltipTrigger>
			<TooltipContent>Change color</TooltipContent>
		</Tooltip>
		<PopoverContent className="w-fit">
			<HexColorPicker
				color={brushOptions.color}
				onChange={(color) => onColorChange(color)}
			/>
		</PopoverContent>
	</Popover>
);
