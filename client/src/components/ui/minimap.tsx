import { WORLD_SIZE } from "@spot/shared";
import { MapIcon } from "lucide-react";
import { type Ref, useState } from "react";
import { Button } from "#/components/shadcn/button";
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
import { MINIMAP_OPEN_QUERY } from "#/lib/options";

const STAY_OPEN_REASONS = ["outside-press", "focus-out"];

export const Minimap = ({
	canvasRef,
}: {
	canvasRef: Ref<HTMLCanvasElement>;
}) => {
	const [open, setOpen] = useState(
		() => window.matchMedia(MINIMAP_OPEN_QUERY).matches,
	);

	const label = open ? "Hide map" : "Show map";

	return (
		<Popover
			open={open}
			onOpenChange={(next, { reason }) => {
				if (next || !STAY_OPEN_REASONS.includes(reason)) setOpen(next);
			}}
		>
			<Tooltip>
				<TooltipTrigger
					render={
						<PopoverTrigger
							render={
								<Button
									variant="outline"
									size="icon"
									className="absolute top-4 right-4 sm:top-auto sm:bottom-4 z-50 rounded-full bg-background"
									aria-label={label}
								/>
							}
						/>
					}
				>
					<MapIcon />
				</TooltipTrigger>
				<TooltipContent side="left">{label}</TooltipContent>
			</Tooltip>
			<PopoverContent
				side="top"
				align="end"
				initialFocus={false}
				className="w-fit p-1.5"
			>
				<div
					className="w-40 sm:w-48 overflow-hidden rounded-xl border"
					style={{ aspectRatio: `${WORLD_SIZE.width} / ${WORLD_SIZE.height}` }}
				>
					<canvas
						className="block size-full touch-none cursor-pointer"
						ref={canvasRef}
						onContextMenu={(e) => e.preventDefault()}
					></canvas>
				</div>
			</PopoverContent>
		</Popover>
	);
};
