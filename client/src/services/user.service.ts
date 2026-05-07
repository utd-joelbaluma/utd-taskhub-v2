import { api } from "@/lib/api";

export interface UserProfile {
	id: string;
	full_name: string | null;
	email: string;
	avatar_url: string | null;
	role: string;
	status: string;
	created_at: string;
}

export interface UserInvitation {
	id: string;
	email: string;
	invited_at: string;
	invite_cancelled_at: string | null;
}

export async function listUsers(): Promise<UserProfile[]> {
	const res = await api.get<{ success: boolean; data: UserProfile[] }>("/users");
	return res.data;
}

export async function inviteUser(email: string, role: string): Promise<void> {
	await api.post("/users/invite", { email, role });
}

export async function listUserInvitations(
	status?: "pending" | "cancelled"
): Promise<UserInvitation[]> {
	const params = status ? `?status=${status}` : "";
	const res = await api.get<{ success: boolean; data: UserInvitation[] }>(
		`/users/invitations${params}`
	);
	return res.data;
}

export async function cancelUserInvitation(userId: string): Promise<void> {
	await api.delete(`/users/invitations/${userId}`);
}
