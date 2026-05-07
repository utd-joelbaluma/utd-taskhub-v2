import { api } from "@/lib/api";

export type SprintStatus = "planned" | "active" | "completed";

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  created_by: {
    id: string;
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateSprintPayload {
  name: string;
  start_date: string;
  end_date: string;
  status?: SprintStatus;
}

export interface UpdateSprintPayload {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: SprintStatus;
}

export async function listSprints(projectId: string): Promise<Sprint[]> {
  const res = await api.get(`/projects/${projectId}/sprints`);
  return res.data.data;
}

export async function createSprint(projectId: string, payload: CreateSprintPayload): Promise<Sprint> {
  const res = await api.post(`/projects/${projectId}/sprints`, payload);
  return res.data.data;
}

export async function updateSprint(projectId: string, sprintId: string, payload: UpdateSprintPayload): Promise<Sprint> {
  const res = await api.patch(`/projects/${projectId}/sprints/${sprintId}`, payload);
  return res.data.data;
}

export async function deleteSprint(projectId: string, sprintId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
}
