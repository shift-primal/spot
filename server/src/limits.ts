import type { Socket } from "socket.io";
import {
	DROP_LOG_INTERVAL_MS,
	IP_SEGMENT_BURST,
	IP_SEGMENT_RATE,
	MAX_CONNECTIONS_PER_IP,
	SEGMENT_BURST,
	SEGMENT_RATE,
	TRUST_PROXY,
} from "./options.ts";

interface Bucket {
	tokens: number;
	at: number;
}

export type DropReason = "rate" | "ip rate" | "invalid";

const createBucket = (burst: number): Bucket => ({
	tokens: burst,
	at: performance.now(),
});

const take = (bucket: Bucket, rate: number, burst: number) => {
	const now = performance.now();
	bucket.tokens = Math.min(
		burst,
		bucket.tokens + ((now - bucket.at) / 1000) * rate,
	);
	bucket.at = now;
	if (bucket.tokens < 1) return false;
	bucket.tokens -= 1;
	return true;
};

const connections = new Map<string, number>();

const ipBuckets = new Map<string, Bucket>();

export const clientIp = (socket: Socket) => {
	const forwarded = socket.handshake.headers["x-forwarded-for"];
	const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
	const proxied = TRUST_PROXY && header?.split(",").at(-1)?.trim();
	return proxied || socket.handshake.address;
};

export const acquireConnection = (ip: string) => {
	const count = connections.get(ip) ?? 0;
	if (count >= MAX_CONNECTIONS_PER_IP) return false;
	connections.set(ip, count + 1);
	return true;
};

export const releaseConnection = (ip: string) => {
	const count = (connections.get(ip) ?? 1) - 1;
	if (count > 0) {
		connections.set(ip, count);
		return;
	}
	connections.delete(ip);
	ipBuckets.delete(ip);
};

export const createLimiter = (ip: string) => {
	const socketBucket = createBucket(SEGMENT_BURST);

	return (): DropReason | null => {
		if (!take(socketBucket, SEGMENT_RATE, SEGMENT_BURST)) return "rate";

		let ipBucket = ipBuckets.get(ip);
		if (!ipBucket) {
			ipBucket = createBucket(IP_SEGMENT_BURST);
			ipBuckets.set(ip, ipBucket);
		}
		if (!take(ipBucket, IP_SEGMENT_RATE, IP_SEGMENT_BURST)) return "ip rate";

		return null;
	};
};

export const createDropLog = (socketId: string) => {
	const counts = new Map<DropReason, number>();
	let loggedAt = -Infinity;

	const flush = () => {
		for (const [reason, count] of counts) {
			console.log(`dropped ${count} segments from ${socketId} (${reason})`);
		}
		counts.clear();
		loggedAt = performance.now();
	};

	const drop = (reason: DropReason) => {
		counts.set(reason, (counts.get(reason) ?? 0) + 1);
		if (performance.now() - loggedAt >= DROP_LOG_INTERVAL_MS) flush();
	};

	return { drop, flush };
};
