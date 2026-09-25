import {
	type DrawnSegment,
	OVERVIEW_SCALE,
	OVERVIEW_SEQ_HEADER,
	overviewLineWidth,
	type Size,
	WORLD_SIZE,
} from "@spot/shared";
import { createBitmap, paintSegment } from "#/lib/canvas";
import { clamp } from "#/lib/general";
import {
	MINIMAP_VIEW_COLOR,
	MINIMAP_VIEW_WIDTH,
	TILE_RETRY_MS,
} from "#/lib/options";
import type { Camera } from "#/types";

export const createOverview = (requestFrame: () => void) => {
	const { bitmap, ctx } = createBitmap(
		Math.ceil(WORLD_SIZE.width * OVERVIEW_SCALE),
		Math.ceil(WORLD_SIZE.height * OVERVIEW_SCALE),
	);
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	let connected = false;
	let held: DrawnSegment[] = [];
	let controller: AbortController | null = null;
	let retry: ReturnType<typeof setTimeout> | null = null;

	const paint = (segment: DrawnSegment) => {
		ctx.setTransform(OVERVIEW_SCALE, 0, 0, OVERVIEW_SCALE, 0, 0);
		paintSegment(ctx, { ...segment, size: overviewLineWidth(segment.size) });
	};

	const cancel = () => {
		controller?.abort();
		controller = null;
		if (retry) clearTimeout(retry);
		retry = null;
		held = [];
	};

	const load = async () => {
		cancel();

		const current = new AbortController();
		controller = current;

		try {
			const res = await fetch("/overview", { signal: current.signal });
			if (!res.ok) throw new Error(`overview: ${res.status}`);
			const seq = Number(res.headers.get(OVERVIEW_SEQ_HEADER));
			const image = await createImageBitmap(await res.blob());
			if (controller !== current) {
				image.close();
				return;
			}

			controller = null;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.drawImage(image, 0, 0);
			image.close();

			for (const segment of held) {
				if (segment.seq > seq) paint(segment);
			}
			held = [];
			requestFrame();
		} catch {
			if (controller !== current) return;

			controller = null;
			held = [];
			retry = setTimeout(() => {
				retry = null;
				if (connected) load();
			}, TILE_RETRY_MS);
		}
	};

	const receive = (segment: DrawnSegment) => {
		if (controller) {
			held.push(segment);
		} else if (connected) {
			paint(segment);
			requestFrame();
		}
	};

	const setConnected = (value: boolean) => {
		connected = value;
		if (value) load();
		else cancel();
	};

	return { bitmap, receive, setConnected, dispose: cancel };
};

export type Overview = ReturnType<typeof createOverview>;

export const drawMinimap = (
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	overview: Overview,
	{ x, y, zoom }: Camera,
	viewport: Size,
) => {
	const { width, height } = canvas;
	const scaleX = width / WORLD_SIZE.width;
	const scaleY = height / WORLD_SIZE.height;
	const lineWidth = MINIMAP_VIEW_WIDTH * (width / canvas.clientWidth);

	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.imageSmoothingQuality = "high";
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(overview.bitmap, 0, 0, width, height);

	const inset = lineWidth / 2;
	const left = clamp(x * scaleX, inset, width - inset);
	const top = clamp(y * scaleY, inset, height - inset);
	const right = clamp(
		(x + viewport.width / zoom) * scaleX,
		inset,
		width - inset,
	);
	const bottom = clamp(
		(y + viewport.height / zoom) * scaleY,
		inset,
		height - inset,
	);

	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = MINIMAP_VIEW_COLOR;
	ctx.strokeRect(left, top, right - left, bottom - top);
};
