import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/permissions";

export function usePermission() {
	const { user } = useAuth();
	const roleKey = user?.global_role?.key ?? user?.role ?? null;

	return {
		roleKey,
		can: (feature: string) => canAccess(roleKey, feature),
	};
}
