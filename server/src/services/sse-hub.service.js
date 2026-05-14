const clients = new Map();

export function register(userId, req, res) {
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache, no-transform");
	res.setHeader("Connection", "keep-alive");
	res.setHeader("X-Accel-Buffering", "no");
	res.flushHeaders?.();
	res.write(`event: ready\ndata: {}\n\n`);

	if (!clients.has(userId)) clients.set(userId, new Set());
	clients.get(userId).add(res);

	const heartbeat = setInterval(() => {
		try {
			res.write(`: ping\n\n`);
		} catch {
			cleanup();
		}
	}, 25_000);

	function cleanup() {
		clearInterval(heartbeat);
		const set = clients.get(userId);
		if (set) {
			set.delete(res);
			if (set.size === 0) clients.delete(userId);
		}
		try {
			res.end();
		} catch {
			// already closed
		}
	}

	req.on("close", cleanup);
	req.on("error", cleanup);
}

export function publish(userId, payload) {
	const set = clients.get(userId);
	if (!set || set.size === 0) return;
	const frame = `data: ${JSON.stringify(payload)}\n\n`;
	for (const res of set) {
		try {
			res.write(frame);
		} catch (err) {
			console.error("[sse] write failed:", err.message);
		}
	}
}

export function connectionCount(userId) {
	return clients.get(userId)?.size ?? 0;
}
