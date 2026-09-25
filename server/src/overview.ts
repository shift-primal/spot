import { createCanvas } from "@napi-rs/canvas";
import {
	OVERVIEW_SCALE,
	overviewLineWidth,
	TILE_COUNT,
	type TileStroke,
	tileKey,
	tileRect,
	WORLD_SIZE,
} from "@spot/shared";
import { currentSeq, tileStrokes, tileVersion } from "./canvas.ts";

const canvas = createCanvas(
	Math.ceil(WORLD_SIZE.width * OVERVIEW_SCALE),
	Math.ceil(WORLD_SIZE.height * OVERVIEW_SCALE),
);
const ctx = canvas.getContext("2d");
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.setTransform(OVERVIEW_SCALE, 0, 0, OVERVIEW_SCALE, 0, 0);

const rendered = new Map<string, number>();

let png: Buffer | null = null;

const paintStroke = ({ points, color, size }: TileStroke) => {
	const width = overviewLineWidth(size);

	ctx.beginPath();
	if (points.length === 2) {
		ctx.fillStyle = color;
		ctx.arc(points[0], points[1], width / 2, 0, Math.PI * 2);
		ctx.fill();
		return;
	}

	ctx.lineWidth = width;
	ctx.strokeStyle = color;
	ctx.moveTo(points[0], points[1]);
	for (let i = 2; i < points.length; i += 2) {
		ctx.lineTo(points[i], points[i + 1]);
	}
	ctx.stroke();
};

const renderTile = (tx: number, ty: number) => {
	const { minX, minY, maxX, maxY } = tileRect({ tx, ty });

	ctx.save();
	ctx.beginPath();
	ctx.rect(minX, minY, maxX - minX, maxY - minY);
	ctx.clip();
	ctx.fillStyle = "#fff";
	ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
	for (const stroke of tileStrokes({ tx, ty })) paintStroke(stroke);
	ctx.restore();
};

export const overview = () => {
	let changed = false;

	for (let ty = 0; ty < TILE_COUNT; ty++) {
		for (let tx = 0; tx < TILE_COUNT; tx++) {
			const key = tileKey(tx, ty);
			const version = tileVersion(key);
			if (rendered.get(key) === version) continue;

			renderTile(tx, ty);
			rendered.set(key, version);
			changed = true;
		}
	}

	if (changed || !png) png = canvas.toBuffer("image/png");

	return { png, seq: currentSeq() };
};
