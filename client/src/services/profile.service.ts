import { api } from "@/lib/api";

export interface Profile {
	id: string;
	full_name: string | null;
	email: string;
	avatar_url: string | null;
	role: string;
	status: string;
}

export async function listProfiles(): Promise<Profile[]> {
	const res = await api.get<{ success: boolean; data: Profile[] }>("/profiles");
	return res.data;
}
