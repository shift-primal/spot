import { Eraser, Pencil } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
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
			<ToggleGroupItem
				className="border"
				value="pencil"
				aria-label="Swap to pencil"
			>
				<Pencil />
			</ToggleGroupItem>
			<ToggleGroupItem
				className="border"
				value="eraser"
				aria-label="Swap to eraser"
			>
				<Eraser />
			</ToggleGroupItem>
		</ToggleGroup>
	);
};
