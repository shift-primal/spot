import { createRoot } from "react-dom/client";
import "#/globals.css";
import { App } from "#/app";

// biome-ignore lint/style/noNonNullAssertion: <its fine>
createRoot(document.getElementById("root")!).render(<App />);
