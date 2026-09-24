import { Eraser, Pencil } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "#/components/shadcn/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/shadcn/tooltip";
import type { BrushOptions, Tool } from "#/types";

export const ToolSelection = ({
	brushOptions,
	onToolChange,
}: {
	brushOptions: BrushOptions;
	onToolChange: (tool: Tool) => void;
}) => {
	return (
		<ToggleGroup
			value={[brushOptions.tool]}
			onValueChange={(value) => {
				const [tool] = value;
				if (tool) onToolChange(tool as Tool);
			}}
		>
			<Tooltip>
				<TooltipTrigger
					render={
						<ToggleGroupItem
							className="border"
							value="pencil"
							aria-label="Swap to pencil"
						/>
					}
				>
					<Pencil />
				</TooltipTrigger>
				<TooltipContent>Pencil</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					render={
						<ToggleGroupItem
							className="border"
							value="eraser"
							aria-label="Swap to eraser"
						/>
					}
				>
					<Eraser />
				</TooltipTrigger>
				<TooltipContent>Eraser</TooltipContent>
			</Tooltip>
		</ToggleGroup>
	);
};
