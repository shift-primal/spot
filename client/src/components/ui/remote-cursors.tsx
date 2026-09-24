import type { Cursor } from "@spot/shared";
import type { RefObject } from "react";
import { CURSOR_SEND_INTERVAL } from "#/lib/options";

// world-space layer; useDrawingCanvas sets its transform to follow the camera
export const RemoteCursors = ({
	cursors,
	layerRef,
}: {
	cursors: Map<string, Cursor>;
	layerRef: RefObject<HTMLDivElement | null>;
}) => (
	// z = 30, below the local cursor (40) and toolbar (50)
	<div
		ref={layerRef}
		className="absolute top-0 left-0 z-30 origin-top-left pointer-events-none"
	>
		{[...cursors].map(([id, { position, color, size }]) => (
			<div
				key={id}
				className="absolute rounded-full -translate-1/2 opacity-70"
				style={{
					left: position.x,
					top: position.y,
					width: size,
					height: size,
					backgroundColor: color,
					// keep the outline 1 screen px regardless of zoom
					outline: "calc(1px / var(--zoom)) solid",
					outlineOffset: "calc(-1px / var(--zoom))",
					// glide between throttled updates
					transition: `left ${CURSOR_SEND_INTERVAL}ms linear, top ${CURSOR_SEND_INTERVAL}ms linear`,
				}}
			/>
		))}
	</div>
);
