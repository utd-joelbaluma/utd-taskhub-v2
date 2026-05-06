import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
			</div>
		);
	}

	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
