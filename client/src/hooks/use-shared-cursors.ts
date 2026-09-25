import type { Point, RemoteCursor } from "@spot/shared";
import { type RefObject, useEffect, useRef, useState } from "react";
import { getPoint } from "#/lib/canvas";
import { CURSOR_SEND_INTERVAL } from "#/lib/options";
import { socket } from "#/socket";
import type { BrushOptions } from "#/types";

export const useSharedCursors = ({
	canvasRef,
	brushOptions,
	screenToWorld,
}: {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	brushOptions: BrushOptions;
	screenToWorld: (p: Point) => Point;
}) => {
	const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map());

	const positionRef = useRef<Point | null>(null);
	const rightHeldRef = useRef(false);
	const brushOptionsRef = useRef(brushOptions);
	brushOptionsRef.current = brushOptions;

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dirtyRef = useRef(false);

	const sendNow = () => {
		const position = positionRef.current;
		if (!position) return;

		const { tool, color, size } = brushOptionsRef.current;
		const erasing = (tool === "eraser") !== rightHeldRef.current;

		socket.volatile.emit("cursor:move", {
			position,
			color: erasing ? "#fff" : color,
			size,
		});
	};

	const send = () => {
		if (timerRef.current) {
			dirtyRef.current = true;
			return;
		}

		sendNow();
		timerRef.current = setTimeout(function flush() {
			if (dirtyRef.current) {
				dirtyRef.current = false;
				sendNow();
				timerRef.current = setTimeout(flush, CURSOR_SEND_INTERVAL);
			} else {
				timerRef.current = null;
			}
		}, CURSOR_SEND_INTERVAL);
	};
	const sendRef = useRef(send);
	sendRef.current = send;

	// sending
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleLeave = (e: PointerEvent) => {
			if (e.pointerType === "touch" || !positionRef.current) return;

			positionRef.current = null;
			dirtyRef.current = false;
			socket.emit("cursor:leave");
		};

		const handlePointer = (e: PointerEvent) => {
			if (
				e.pointerType === "touch" &&
				(e.type === "pointerup" || e.type === "pointercancel")
			) {
				return;
			}

			positionRef.current = screenToWorld(getPoint(e, canvas));
			rightHeldRef.current = (e.buttons & 2) !== 0;
			sendRef.current();
		};

		canvas.addEventListener("pointermove", handlePointer);
		canvas.addEventListener("pointerdown", handlePointer);
		canvas.addEventListener("pointerup", handlePointer);
		canvas.addEventListener("pointercancel", handlePointer);
		canvas.addEventListener("pointerleave", handleLeave);

		return () => {
			canvas.removeEventListener("pointermove", handlePointer);
			canvas.removeEventListener("pointerdown", handlePointer);
			canvas.removeEventListener("pointerup", handlePointer);
			canvas.removeEventListener("pointercancel", handlePointer);
			canvas.removeEventListener("pointerleave", handleLeave);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = null;
		};
	}, [canvasRef, screenToWorld]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <re-send when the brush changes>
	useEffect(() => {
		sendRef.current();
	}, [brushOptions]);

	useEffect(() => {
		const handleMove = (id: string, cursor: RemoteCursor) =>
			setCursors((prev) => new Map(prev).set(id, cursor));

		const handleLeave = (id: string) =>
			setCursors((prev) => {
				if (!prev.has(id)) return prev;
				const next = new Map(prev);
				next.delete(id);
				return next;
			});

		const handleDisconnect = () => setCursors(new Map());

		socket.on("cursor:move", handleMove);
		socket.on("cursor:leave", handleLeave);
		socket.on("disconnect", handleDisconnect);

		return () => {
			socket.off("cursor:move", handleMove);
			socket.off("cursor:leave", handleLeave);
			socket.off("disconnect", handleDisconnect);
		};
	}, []);

	return { cursors };
};
