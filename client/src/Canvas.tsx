import { useEffect, useRef, useState } from "react";

const CanvasContainer = ({ children }: { children: React.ReactNode }) => (
	<div className="border-2 w-7xl mx-auto mt-20 flex flex-col items-center">
		{children}
	</div>
);

interface BrushOptions {
	brushColor: string;
	brushSize: number;
}

interface LastPoint {
	x: number;
	y: number;
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

	const lastPointRef = useRef<LastPoint>({ x: 0, y: 0 });

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
		lastPointRef.current = point;

		ctx.beginPath();
		ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();
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
		</CanvasContainer>
	);
};
