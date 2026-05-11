import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

interface RoleGuardProps {
	feature: string;
	redirect?: string;
}

export default function RoleGuard({
	feature,
	redirect = "/",
}: RoleGuardProps) {
	const { loading } = useAuth();
	const { can } = usePermission();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
			</div>
		);
	}

	return can(feature) ? <Outlet /> : <Navigate to={redirect} replace />;
}
