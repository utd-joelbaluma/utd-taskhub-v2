const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

function getToken(): string | null {
	return localStorage.getItem("access_token");
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
	const token = getToken();
	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(extra ?? {}),
	};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		headers: buildHeaders(options.headers as HeadersInit),
	});

	const json = await res.json().catch(() => ({}));

	if (res.status === 401) {
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		throw new Error("Session expired.");
	}

	if (!res.ok) {
		throw new Error(
			(json as { message?: string }).message ?? "Request failed.",
		);
	}

	return json as T;
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body: unknown) =>
		request<T>(path, { method: "POST", body: JSON.stringify(body) }),
	patch: <T>(path: string, body: unknown) =>
		request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
