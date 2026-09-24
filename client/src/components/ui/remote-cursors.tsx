import type { RemoteCursor } from "@spot/shared";
import type { RefObject } from "react";
import { CURSOR_SEND_INTERVAL } from "#/lib/options";

export const RemoteCursors = ({
	cursors,
	layerRef,
}: {
	cursors: Map<string, RemoteCursor>;
	layerRef: RefObject<HTMLDivElement | null>;
}) => (
	// z = 30, below the local cursor (40) and toolbar (50)
	<div
		ref={layerRef}
		className="absolute top-0 left-0 z-30 origin-top-left pointer-events-none"
	>
		{[...cursors].map(([id, { position, color, size, name }]) => (
			<div
				key={id}
				className="absolute"
				style={{
					left: position.x,
					top: position.y,
					transition: `left ${CURSOR_SEND_INTERVAL}ms linear, top ${CURSOR_SEND_INTERVAL}ms linear`,
				}}
			>
				<div
					className="absolute rounded-full -translate-1/2 opacity-70"
					style={{
						width: size,
						height: size,
						backgroundColor: color,
						outline: "calc(1px / var(--zoom)) solid",
						outlineOffset: "calc(-1px / var(--zoom))",
					}}
				/>
				<div
					className="absolute origin-top-left whitespace-nowrap rounded-2xl bg-foreground px-2 py-0.5 text-xs text-background"
					style={{
						left: size / 2,
						top: size / 2,
						scale: "calc(1 / var(--zoom))",
					}}
				>
					{name}
				</div>
			</div>
		))}
	</div>
);
