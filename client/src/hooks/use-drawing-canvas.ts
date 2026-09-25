import { WORLD_SIZE } from "@spot/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBrushControls } from "#/hooks/use-brush-controls";
import { useCamera } from "#/hooks/use-camera";
import { useCameraControls } from "#/hooks/use-camera-controls";
import { type Surface, useCanvasSurface } from "#/hooks/use-canvas-surface";
import { useSharedCursors } from "#/hooks/use-shared-cursors";
import { useSharedSegments } from "#/hooks/use-shared-segments";
import { useStroke } from "#/hooks/use-stroke";
import { createScene } from "#/lib/scene";
import type { BrushOptions } from "#/types";

export const useDrawingCanvas = (
	brushOptions: BrushOptions,
	spaceHeld: boolean,
	onSizeChange: (size: number) => void,
) => {
	const { cameraRef, zoom, screenToWorld, panBy, clampToWorld, zoomAt } =
		useCamera();
	const cursorLayerRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number | null>(null);
	const redrawRef = useRef<() => void>(() => {});

	const requestFrame = useCallback(() => {
		if (frameRef.current !== null) return;
		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = null;
			redrawRef.current();
		});
	}, []);

	const [scene] = useState(() => createScene(requestFrame));

	useEffect(
		() => () => {
			if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
			scene.dispose();
		},
		[scene],
	);

	const drawScene = useCallback(
		({ canvas, ctx }: Surface) => {
			const camera = cameraRef.current;
			const { x, y, zoom } = camera;
			const dpr = window.devicePixelRatio || 1;

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.setTransform(
				dpr * zoom,
				0,
				0,
				dpr * zoom,
				-x * dpr * zoom,
				-y * dpr * zoom,
			);
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, WORLD_SIZE.width, WORLD_SIZE.height);

			scene.draw(ctx, camera, canvas.clientWidth, canvas.clientHeight, dpr);

			// move the remote cursor layer with the camera (world -> screen)
			const layer = cursorLayerRef.current;
			if (layer) {
				layer.style.transform = `scale(${zoom}) translate(${-x}px, ${-y}px)`;
				layer.style.setProperty("--zoom", String(zoom));
			}
		},
		[cameraRef, scene],
	);

	const { canvasRef, getSurface } = useCanvasSurface(drawScene);

	const redraw = useCallback(() => {
		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
		}
		const surface = getSurface();
		if (surface) drawScene(surface);
	}, [getSurface, drawScene]);

	useEffect(() => {
		redrawRef.current = redraw;
	}, [redraw]);

	const { isPanning } = useCameraControls({
		canvasRef,
		spaceHeld,
		panBy,
		zoomAt,
		clampToWorld,
		redraw,
	});

	const { resizeAnchor } = useBrushControls({
		canvasRef,
		size: brushOptions.size,
		onSizeChange,
	});

	const { cursors } = useSharedCursors({
		canvasRef,
		brushOptions,
		screenToWorld,
	});

	const { sendSegment, endStroke } = useSharedSegments({
		onSegment: scene.receive,
		onConnectionChange: scene.setConnected,
	});

	const { startDrawing, continueDrawing, stopDrawing } = useStroke({
		canvasRef,
		brushOptions,
		screenToWorld,
		spaceHeld,
		onSegment: (segment) => {
			scene.paintOwn(segment);
			sendSegment(segment);
		},
		onStrokeEnd: endStroke,
	});

	return {
		canvasRef,
		cameraRef,
		zoom,
		isPanning,
		resizeAnchor,
		cursors,
		cursorLayerRef,
		redraw,
		startDrawing,
		continueDrawing,
		stopDrawing,
	};
};
