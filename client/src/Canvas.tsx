import { useEffect, useRef, useState } from "react";
import { socket } from "#/socket";

const CanvasContainer = ({ children }: { children: React.ReactNode }) => (
	<div className="border-2 w-7xl mx-auto mt-20 flex flex-col items-center">
		{children}
	</div>
);

interface BrushOptions {
	brushColor: string;
	brushSize: number;
}

interface Coordinates {
	x: number;
	y: number;
}

interface DrawPayload {
	from: Coordinates;
	to: Coordinates;
	color: string;
	size: number;
}

const getCoords = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
	};
};

export const Canvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	const lastPointRef = useRef<Coordinates>({ x: 0, y: 0 });

	const [isDrawing, setIsDrawing] = useState<boolean>(false);

	const [brushOptions, setBrushOptions] = useState<BrushOptions>({
		brushColor: "#000fff",
		brushSize: 5,
	});

	useEffect(() => {
		const ctx = canvasRef.current.getContext("2d");
		ctx.lineJoin = "round";
		ctx.lineCap = "round";

		ctxRef.current = ctx;

		console.log("Canvas set up, ready to draw");
	}, []);

	const startDrawing = (e) => {
		const point = getCoords(e, canvasRef.current);
		lastPointRef.current = point;

		setIsDrawing(true);

		console.log("Started drawing at", point);
	};

	const draw = (e) => {
		const ctx = ctxRef.current;

		if (!ctx || !lastPointRef.current) return;

		ctx.lineWidth = brushOptions.brushSize;
		ctx.strokeStyle = brushOptions.brushColor;

		const point = getCoords(e, canvasRef.current);

		ctx.beginPath();
		ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();

		const payload: DrawPayload = {
			from: { x: lastPointRef.current.x, y: lastPointRef.current.y },
			to: { x: point.x, y: point.y },
			color: brushOptions.brushColor,
			size: brushOptions.brushSize,
		};

		socket.emit("draw", payload);

		lastPointRef.current = point;

		console.log("Drawing at", point);
	};

	const stopDrawing = () => {
		setIsDrawing(false);

		console.log("Stopped drawing");
	};

	const resetCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		console.log("Reset canvas");
	};

	const changeBrushSize = (action: "inc" | "dec") => {
		const step = action === "inc" ? 1 : -1;

		setBrushOptions({
			...brushOptions,
			brushSize: brushOptions.brushSize + step,
		});
	};

	const changeBrushColor = (e: React.ChangeEvent<HTMLInputElement>) => {
		const color = e.target.value;

		setBrushOptions({ ...brushOptions, brushColor: color });
	};

	return (
		<CanvasContainer>
			<canvas
				width="1000"
				height="500"
				className="border m-auto my-10"
				ref={canvasRef}
				onMouseDown={(e) => startDrawing(e)}
				onMouseMove={(e) => {
					if (!isDrawing) return;
					draw(e);
				}}
				onMouseUp={() => stopDrawing()}
				onMouseLeave={() => {
					if (!isDrawing) return;
					stopDrawing();
				}}
			></canvas>
			<button
				type="button"
				className="border px-4 py-0.5 cursor-pointer bg-red-200 active:bg-red-400 mb-5"
				onClick={resetCanvas}
			>
				Reset
			</button>
			<div className="flex gap-2">
				<div className="flex flex-col items-center">
					<div className="flex gap-2">
						<button
							type="button"
							className="border px-4 py-0.5 cursor-pointer bg-gray-50 active:bg-gray-200"
							onClick={() => changeBrushSize("inc")}
						>
							+
						</button>
						<button
							type="button"
							className="border px-4 py-0.5 cursor-pointer bg-gray-50 active:bg-gray-200"
							onClick={() => changeBrushSize("dec")}
						>
							-
						</button>
					</div>
					<span>{brushOptions.brushSize}px</span>
				</div>
				<input
					id="color-picker"
					type="color"
					onChange={(e) => changeBrushColor(e)}
					value={brushOptions.brushColor}
				/>
			</div>
		</CanvasContainer>
	);
};
