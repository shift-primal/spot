import type { BrushOptions, Tool } from "#/types";

export interface ToolbarProps {
	brushOptions: BrushOptions;
	onToolChange: (tool: Tool) => void;
	onSizeChange: (action: "inc" | "dec") => void;
	onColorChange: (color: string) => void;
}

export const Toolbar = ({
	brushOptions,
	onToolChange,
	onSizeChange,
	onColorChange,
}: ToolbarProps) => {
	return (
		<div className="flex gap-2">
			<div className="flex flex-col items-center">
				<div className="flex gap-2">
					<button
						type="button"
						className="border px-4 py-0.5 cursor-pointer bg-gray-50 active:bg-gray-200"
						onClick={() => onToolChange("pencil")}
					>
						Pencil
					</button>

					<button
						type="button"
						className="border px-4 py-0.5 cursor-pointer bg-gray-50 active:bg-gray-200"
						onClick={() => onToolChange("eraser")}
					>
						Eraser
					</button>
					<button
						type="button"
						className="border px-4 py-0.5 cursor-pointer bg-gray-50 active:bg-gray-200"
						onClick={() => onSizeChange("inc")}
					>
						+
					</button>
					<button
						type="button"
						className="border px-4 py-0.5 cursor-pointer bg-gray-50 active:bg-gray-200"
						onClick={() => onSizeChange("dec")}
					>
						-
					</button>
				</div>
				<span>{brushOptions.size}px</span>
			</div>
			<input
				id="color-picker"
				type="color"
				onChange={(e) => onColorChange(e.target.value)}
				value={brushOptions.color}
			/>
		</div>
	);
};
