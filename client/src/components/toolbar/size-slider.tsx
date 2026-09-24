import { Slider } from "#/components/shadcn/slider";
import { BRUSH_SIZE_BOUNDS } from "#/lib/options";
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
			className="min-w-48"
			min={BRUSH_SIZE_BOUNDS.min}
			max={BRUSH_SIZE_BOUNDS.max}
			value={[brushOptions.size]}
			onValueChange={(val) =>
				onSizeChange(typeof val === "number" ? val : val[0])
			}
			thumbLabel={(size) => `${size}px`}
		/>
	);
};
