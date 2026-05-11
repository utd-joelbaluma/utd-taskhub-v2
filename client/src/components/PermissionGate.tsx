import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGateProps {
	feature: string;
	fallback?: ReactNode;
	children: ReactNode;
}

export function PermissionGate({
	feature,
	fallback = null,
	children,
}: PermissionGateProps) {
	const { can } = usePermission();
	return can(feature) ? <>{children}</> : <>{fallback}</>;
}
