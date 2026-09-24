import type { Point } from "@spot/shared";
import type { ReactNode, RefObject } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/shadcn/tooltip";
import { usePaintCursor } from "#/hooks/use-paint-cursor";
import type { BrushOptions } from "#/types";

export const PaintCursor = ({
	brushOptions,
	canvasRef,
	zoom,
	hidden,
	anchor,
	label,
}: {
	brushOptions: BrushOptions;
	canvasRef: RefObject<HTMLCanvasElement | null>;
	zoom: number;
	hidden: boolean;
	anchor: Point | null;
	label?: ReactNode;
}) => {
	const { position, erasing } = usePaintCursor(canvasRef, brushOptions.tool);

	const at = anchor ?? position;
	if (!at || hidden) return null;

	const size = brushOptions.size * zoom;

	return (
		<Tooltip open={label != null}>
			<TooltipTrigger
				render={
					// z = 40, toolbar (50) should be over cursor
					<div
						className="rounded-full z-40 fixed -translate-1/2 pointer-events-none outline -outline-offset-1"
						style={{
							backgroundColor: erasing ? "#fff" : brushOptions.color,
							height: size,
							width: size,
							left: `${at.x}px`,
							top: `${at.y}px`,
						}}
					/>
				}
			/>
			{label != null && (
				<TooltipContent className="pointer-events-none">{label}</TooltipContent>
			)}
		</Tooltip>
	);
};
