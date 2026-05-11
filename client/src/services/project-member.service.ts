import { api } from "@/lib/api";

export type MemberRole = "owner" | "manager" | "member" | "viewer";

export interface ProjectMember {
	id: string;
	project_id: string;
	user_id: string;
	role: MemberRole;
	joined_at: string;
	profiles: {
		id: string;
		full_name: string | null;
		email: string;
		avatar_url: string | null;
	};
}

export async function listMembers(projectId: string): Promise<ProjectMember[]> {
	const res = await api.get<{ success: boolean; data: ProjectMember[] }>(
		`/projects/${projectId}/members`
	);
	return res.data;
}

export async function addMember(
	projectId: string,
	userId: string,
	role: MemberRole = "member"
): Promise<ProjectMember> {
	const res = await api.post<{ success: boolean; data: ProjectMember }>(
		`/projects/${projectId}/members`,
		{ user_id: userId, role }
	);
	return res.data;
}

export async function updateMemberRole(
	projectId: string,
	userId: string,
	role: MemberRole
): Promise<ProjectMember> {
	const res = await api.patch<{ success: boolean; data: ProjectMember }>(
		`/projects/${projectId}/members/${userId}`,
		{ role }
	);
	return res.data;
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
	await api.delete(`/projects/${projectId}/members/${userId}`);
}
