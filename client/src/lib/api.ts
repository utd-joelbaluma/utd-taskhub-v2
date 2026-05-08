import {
	clearStoredAuth,
	getStoredAccessToken,
	getStoredRefreshToken,
	getStoredRememberUntil,
	storeAuthTokens,
} from "@/lib/auth-storage";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

function getToken(): string | null {
	return getStoredAccessToken();
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
	const token = getToken();
	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(extra ?? {}),
	};
}

async function refreshStoredSession(): Promise<boolean> {
	const refreshToken = getStoredRefreshToken();
	if (!refreshToken) return false;

	const res = await fetch(`${API_URL}/auth/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refresh_token: refreshToken }),
	});

	const json = await res.json().catch(() => ({}));

	if (!res.ok) {
		clearStoredAuth();
		return false;
	}

	const data = (
		json as {
			data?: {
				access_token: string;
				refresh_token: string;
				expires_at?: number;
			};
		}
	).data;

	if (!data?.access_token || !data.refresh_token) {
		clearStoredAuth();
		return false;
	}

	const rememberUntil = getStoredRememberUntil();
	storeAuthTokens(data, {
		remember: rememberUntil !== null,
		rememberUntil: rememberUntil ?? undefined,
	});

	return true;
}

function shouldRefreshOnUnauthorized(path: string) {
	return path !== "/auth/login" && path !== "/auth/refresh";
}

async function request<T>(
	path: string,
	options: RequestInit = {},
	canRefresh = true,
): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		headers: buildHeaders(options.headers as HeadersInit),
	});

	const json = await res.json().catch(() => ({}));

	if (res.status === 401) {
		if (canRefresh && shouldRefreshOnUnauthorized(path)) {
			const refreshed = await refreshStoredSession();
			if (refreshed) return request<T>(path, options, false);
		}

		clearStoredAuth();
		throw new Error(
			(json as { message?: string }).message ?? "Session expired.",
		);
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
