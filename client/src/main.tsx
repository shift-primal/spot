import { createRoot } from "react-dom/client";
import "#/globals.css";
import { App } from "#/app";
import { TooltipProvider } from "#/components/shadcn/tooltip";

// block browser zoom so only the canvas camera zooms
window.addEventListener(
	"wheel",
	(e) => {
		if (e.ctrlKey || e.metaKey) e.preventDefault();
	},
	{ passive: false },
);
window.addEventListener("keydown", (e) => {
	if ((e.ctrlKey || e.metaKey) && ["+", "=", "-", "_", "0"].includes(e.key))
		e.preventDefault();
});
// safari pinch
document.addEventListener("gesturestart", (e) => e.preventDefault());

// biome-ignore lint/style/noNonNullAssertion: <its fine>
createRoot(document.getElementById("root")!).render(
	<TooltipProvider>
		<App />
	</TooltipProvider>,
);
