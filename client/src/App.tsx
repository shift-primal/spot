import { useEffect, useState } from "react";
import { socket } from "#/socket";

export const App = () => {
	const [reply, setReply] = useState<number | null>(null);
	const [shouts, setShouts] = useState<string[]>([]);

	useEffect(() => {
		const onPong = (n: number) => setReply(n);
		const onShout = (shout: string) => setShouts((p) => [...p, shout]);
		socket.on("pong", onPong);
		socket.on("shout", onShout);
		return () => {
			socket.off("pong", onPong);
			socket.off("shout", onShout);
		};
	}, []);

	return (
		<main>
			<button type="button" onClick={() => socket.emit("ping", 41)}>
				ping
			</button>
			<button
				className="block"
				type="button"
				onClick={() => socket.emit("shout", `hello from ${socket.id}`)}
			>
				shout
			</button>
			<p>reply: {reply}</p>
			<ul>
				shouts:
				{shouts.map((s) => (
					<li key={s}>{s}</li>
				))}
			</ul>
		</main>
	);
};
