import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "#/globals.css";
import { App } from "./App.tsx";

// biome-ignore lint/style/noNonNullAssertion: <its fine>
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
