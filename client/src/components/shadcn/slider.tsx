import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";
import { type ReactNode, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/shadcn/tooltip";

const thumbClassName =
	"block size-4 shrink-0 rounded-4xl border border-primary bg-white shadow-sm ring-ring/50 transition-colors select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50";

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	thumbLabel,
	onValueChange,
	onValueCommitted,
	...props
}: SliderPrimitive.Root.Props & {
	thumbLabel?: (value: number) => ReactNode;
}) {
	const _values = Array.isArray(value)
		? value
		: Array.isArray(defaultValue)
			? defaultValue
			: [min, max];

	const [dragging, setDragging] = useState(false);
	const [hovered, setHovered] = useState(false);

	return (
		<SliderPrimitive.Root
			className={cn("data-horizontal:w-full data-vertical:h-full", className)}
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			thumbAlignment="edge"
			onValueChange={(...args) => {
				setDragging(true);
				onValueChange?.(...args);
			}}
			onValueCommitted={(...args) => {
				setDragging(false);
				onValueCommitted?.(...args);
			}}
			{...props}
		>
			<SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="relative grow overflow-hidden rounded-4xl bg-muted select-none data-horizontal:h-3 data-horizontal:w-full data-vertical:h-full data-vertical:w-3"
				>
					<SliderPrimitive.Indicator
						data-slot="slider-range"
						className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
					/>
				</SliderPrimitive.Track>
				{Array.from({ length: _values.length }, (_, index) => {
					const thumb = (
						<SliderPrimitive.Thumb
							data-slot="slider-thumb"
							// biome-ignore lint/suspicious/noArrayIndexKey: <it makes sense>
							key={index}
							className={thumbClassName}
						/>
					);

					if (!thumbLabel) return thumb;

					return (
						<Tooltip
							// biome-ignore lint/suspicious/noArrayIndexKey: <it makes sense>
							key={index}
							open={hovered || dragging}
							onOpenChange={setHovered}
						>
							<TooltipTrigger closeOnClick={false} render={thumb} />
							<TooltipContent>{thumbLabel(_values[index])}</TooltipContent>
						</Tooltip>
					);
				})}
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
