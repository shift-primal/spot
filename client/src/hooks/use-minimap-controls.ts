import { type Point, WORLD_SIZE } from "@spot/shared";
import { type RefObject, useEffect } from "react";
import { getPoint } from "#/lib/canvas";
import type { Camera } from "#/types";

export const useMinimapControls = ({
	minimap,
	canvasRef,
	cameraRef,
	clampToWorld,
	redraw,
}: {
	minimap: HTMLCanvasElement | null;
	canvasRef: RefObject<HTMLCanvasElement | null>;
	cameraRef: RefObject<Camera>;
	clampToWorld: (viewport: { width: number; height: number }) => void;
	redraw: () => void;
}) => {
	useEffect(() => {
		if (!minimap) return;

		let dragPointerId: number | null = null;
		let grab: Point = { x: 0, y: 0 };

		const viewport = () => ({
			width: canvasRef.current?.clientWidth ?? 0,
			height: canvasRef.current?.clientHeight ?? 0,
		});

		const toWorld = (e: PointerEvent): Point => {
			const p = getPoint(e, minimap);
			return {
				x: (p.x / minimap.clientWidth) * WORLD_SIZE.width,
				y: (p.y / minimap.clientHeight) * WORLD_SIZE.height,
			};
		};

		const centerOn = (p: Point) => {
			const camera = cameraRef.current;
			const { width, height } = viewport();
			camera.x = p.x - grab.x - width / camera.zoom / 2;
			camera.y = p.y - grab.y - height / camera.zoom / 2;
			clampToWorld(viewport());
			redraw();
		};

		const handlePointerDown = (e: PointerEvent) => {
			if (e.button !== 0) return;

			e.preventDefault();
			minimap.setPointerCapture(e.pointerId);
			dragPointerId = e.pointerId;

			const { x, y, zoom } = cameraRef.current;
			const { width, height } = viewport();
			const p = toWorld(e);
			const inView =
				p.x >= x &&
				p.x <= x + width / zoom &&
				p.y >= y &&
				p.y <= y + height / zoom;

			grab = inView
				? { x: p.x - x - width / zoom / 2, y: p.y - y - height / zoom / 2 }
				: { x: 0, y: 0 };
			centerOn(p);
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (e.pointerId === dragPointerId) centerOn(toWorld(e));
		};

		const handlePointerUp = (e: PointerEvent) => {
			if (e.pointerId === dragPointerId) dragPointerId = null;
		};

		minimap.addEventListener("pointerdown", handlePointerDown);
		minimap.addEventListener("pointermove", handlePointerMove);
		minimap.addEventListener("pointerup", handlePointerUp);
		minimap.addEventListener("pointercancel", handlePointerUp);

		return () => {
			minimap.removeEventListener("pointerdown", handlePointerDown);
			minimap.removeEventListener("pointermove", handlePointerMove);
			minimap.removeEventListener("pointerup", handlePointerUp);
			minimap.removeEventListener("pointercancel", handlePointerUp);
		};
	}, [minimap, canvasRef, cameraRef, clampToWorld, redraw]);
};
