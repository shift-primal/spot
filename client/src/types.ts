export type Tool = "pencil" | "eraser";

export interface BrushOptions {
	tool: Tool;
	color: string;
	size: number;
}
