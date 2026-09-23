import { Slider } from "#/components/ui/slider";
import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from "#/lib/options";
import type { BrushOptions } from "#/types";

export const SizeSlider = ({
	brushOptions,
	onSizeChange,
}: {
	brushOptions: BrushOptions;
	onSizeChange: (px: number) => void;
}) => {
	return (
		<Slider
			className="min-w-32"
			min={MIN_BRUSH_SIZE}
			max={MAX_BRUSH_SIZE}
			value={[brushOptions.size]}
			onValueChange={(val) =>
				onSizeChange(typeof val === "number" ? val : val[0])
			}
		/>
	);
};
