import { api } from "@/lib/api";
import type { MemberRole, ProjectMember } from "./project-member.service";

export type ProjectStatus = "planning" | "in-progress" | "on-hold" | "completed";

export interface Project {
	id: string;
	name: string;
	description: string | null;
	status: ProjectStatus;
	sprint_name: string | null;
	sprint_end_date: string | null;
	tags: string[];
	created_by: string;
	created_at: string;
	updated_at: string;
	project_members: ProjectMember[];
}

export interface CreateProjectPayload {
	name: string;
	description?: string;
	status?: ProjectStatus;
	sprint_name?: string;
	sprint_end_date?: string;
	tags?: string[];
}

export interface UpdateProjectPayload {
	name?: string;
	description?: string;
	status?: ProjectStatus;
	sprint_name?: string;
	sprint_end_date?: string;
	tags?: string[];
}

export interface AddMembersOptions {
	userIds: string[];
	role?: MemberRole;
}

export async function listProjects(params?: {
	status?: string;
	search?: string;
}): Promise<Project[]> {
	const query = new URLSearchParams();
	if (params?.status) query.set("status", params.status);
	if (params?.search) query.set("search", params.search);
	const qs = query.toString();
	const res = await api.get<{ success: boolean; data: Project[] }>(
		`/projects${qs ? `?${qs}` : ""}`
	);
	return res.data;
}

export async function getProject(id: string): Promise<Project> {
	const res = await api.get<{ success: boolean; data: Project }>(`/projects/${id}`);
	return res.data;
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
	const res = await api.post<{ success: boolean; data: Project }>("/projects", payload);
	return res.data;
}

export async function updateProject(
	id: string,
	payload: UpdateProjectPayload
): Promise<Project> {
	const res = await api.patch<{ success: boolean; data: Project }>(`/projects/${id}`, payload);
	return res.data;
}

export async function deleteProject(id: string): Promise<void> {
	await api.delete(`/projects/${id}`);
}
