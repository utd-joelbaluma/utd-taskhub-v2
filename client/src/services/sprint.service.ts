import { api } from "@/lib/api";

export type SprintStatus = "planned" | "active" | "completed";

export interface Sprint {
  id: string;
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

export async function listSprints(): Promise<Sprint[]> {
  const res = await api.get<{ success: boolean; data: Sprint[] }>("/sprints");
  return res.data;
}

export async function createSprint(payload: CreateSprintPayload): Promise<Sprint> {
  const res = await api.post<{ success: boolean; data: Sprint }>("/sprints", payload);
  return res.data;
}

export async function updateSprint(sprintId: string, payload: UpdateSprintPayload): Promise<Sprint> {
  const res = await api.patch<{ success: boolean; data: Sprint }>(`/sprints/${sprintId}`, payload);
  return res.data;
}

export async function deleteSprint(sprintId: string): Promise<void> {
  await api.delete(`/sprints/${sprintId}`);
}
