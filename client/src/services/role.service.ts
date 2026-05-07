import { api } from "@/lib/api";

export interface RolePermission {
	id: string;
	scope: string;
	key: string;
	description: string;
}

export interface Role {
	id: string;
	scope: string;
	key: string;
	name: string;
	description: string | null;
	is_system: boolean;
	permissions: RolePermission[];
}

export async function listRoles(scope?: string): Promise<Role[]> {
	const params = scope ? `?scope=${scope}` : "";
	const res = await api.get<{ success: boolean; data: Role[] }>(`/roles${params}`);
	return res.data;
}
