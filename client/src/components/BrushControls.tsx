import type { BrushOptions } from "#/types";

export interface BrushControlsProps {
	brushOptions: BrushOptions;
	onSizeChange: (action: "inc" | "dec") => void;
	onColorChange: (color: string) => void;
}

export const BrushControls = ({
	brushOptions,
	onSizeChange,
	onColorChange,
}: BrushControlsProps) => {
	return (
		<div className="flex gap-2">
			<div className="flex flex-col items-center">
				<div className="flex gap-2">
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
				<span>{brushOptions.brushSize}px</span>
			</div>
			<input
				id="color-picker"
				type="color"
				onChange={(e) => onColorChange(e.target.value)}
				value={brushOptions.brushColor}
			/>
		</div>
	);
};
