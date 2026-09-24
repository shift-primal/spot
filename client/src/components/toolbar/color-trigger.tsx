export const ColorTrigger = ({ color }: { color: string }) => (
	<span
		className="block size-full rounded-full outline"
		style={{ backgroundColor: color }}
	/>
);
