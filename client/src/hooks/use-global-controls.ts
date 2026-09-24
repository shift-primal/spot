import { useEffect, useState } from "react";
import { BROWSER_ZOOM_KEYS, TOOL_KEYS } from "#/lib/options";
import type { Tool } from "#/types";

const isEditable = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable ||
		target.tagName === "INPUT" ||
		target.tagName === "TEXTAREA");

export const useGlobalControls = ({
	onToolChange,
}: {
	onToolChange: (tool: Tool) => void;
}) => {
	const [spaceHeld, setSpaceHeld] = useState<boolean>(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && BROWSER_ZOOM_KEYS.includes(e.key)) {
				e.preventDefault();
				return;
			}

			if (isEditable(e.target)) return;

			if (e.code === "Space") {
				e.preventDefault();
				if (!e.repeat) setSpaceHeld(true);
				return;
			}

			const tool = TOOL_KEYS[e.key.toLowerCase()];
			if (tool && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
				onToolChange(tool);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code !== "Space") return;

			e.preventDefault();
			setSpaceHeld(false);
		};

		const handleBlur = () => setSpaceHeld(false);

		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) e.preventDefault();
		};

		const handleGesture = (e: Event) => e.preventDefault();

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("blur", handleBlur);
		window.addEventListener("wheel", handleWheel, { passive: false });
		document.addEventListener("gesturestart", handleGesture);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("wheel", handleWheel);
			document.removeEventListener("gesturestart", handleGesture);
		};
	}, [onToolChange]);

	return { spaceHeld };
};
