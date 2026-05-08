import { api } from "@/lib/api";

export interface Profile {
	id: string;
	full_name: string | null;
	email: string;
	avatar_url: string | null;
	role: string;
	status: string;
	created_at?: string;
}

export interface UpdateProfilePayload {
	full_name?: string | null;
	avatar_url?: string | null;
}

export async function listProfiles(): Promise<Profile[]> {
	const res = await api.get<{ success: boolean; data: Profile[] }>("/profiles");
	return res.data;
}

export async function getProfile(id: string): Promise<Profile> {
	const res = await api.get<{ success: boolean; data: { profile: Profile } }>(`/profiles/${id}`);
	return res.data.profile;
}

export async function updateProfile(id: string, payload: UpdateProfilePayload): Promise<Profile> {
	const res = await api.patch<{ success: boolean; data: { profile: Profile } }>(`/profiles/${id}`, payload);
	return res.data.profile;
}
