import { api } from "@/lib/api";
import type { User } from "@/types/user";

export interface LoginResponse {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user: User;
}

export interface RegisterResponse {
	user: User;
}

export async function loginWithEmail(
	email: string,
	password: string,
): Promise<LoginResponse> {
	const res = await api.post<{ data: LoginResponse }>("/auth/login", {
		email,
		password,
	});
	return res.data;
}

export async function getMe(): Promise<User> {
	const res = await api.get<{ data: { user: User } }>("/auth/me");
	return res.data.user;
}

export async function registerUser(
	email: string,
	password: string,
	full_name: string,
): Promise<RegisterResponse> {
	const res = await api.post<{ data: RegisterResponse }>("/auth/register", {
		email,
		password,
		full_name,
	});
	return res.data;
}

export async function completeInvite(
	fullName: string,
	password: string,
): Promise<void> {
	await api.post("/auth/complete-invite", { full_name: fullName, password });
}

export async function logout(): Promise<void> {
	await api.post("/auth/logout", {}).catch(() => {});
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
}
