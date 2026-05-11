import { api } from "@/lib/api";
import type { SprintCapacitySummary } from "@/types/capacity";

export async function getUserSprintCapacity(
  userId: string,
): Promise<SprintCapacitySummary | null> {
  const res = await api.get<{
    success: boolean;
    data: SprintCapacitySummary | null;
    message?: string;
  }>(`/users/${userId}/sprint-capacity`);
  return res.data;
}
