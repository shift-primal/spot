import { createRoot } from "react-dom/client";
import "#/globals.css";
import { App } from "#/app";
import { TooltipProvider } from "#/components/shadcn/tooltip";

// biome-ignore lint/style/noNonNullAssertion: <its fine>
createRoot(document.getElementById("root")!).render(
	<TooltipProvider>
		<App />
	</TooltipProvider>,
);
