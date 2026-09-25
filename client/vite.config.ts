import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
	const { PORT: port } = loadEnv(mode, import.meta.dirname, "");
	if (command === "serve" && !port) {
		throw new Error("PORT is not set in client/.env");
	}

	return {
		plugins: [
			react(),
			babel({ presets: [reactCompilerPreset()] }),
			tailwindcss(),
		],
		server: {
			proxy: {
				"/socket.io": {
					target: `http://localhost:${port}`,
					ws: true,
					xfwd: true,
				},
				"/tiles": { target: `http://localhost:${port}`, xfwd: true },
			},
		},
	};
});
