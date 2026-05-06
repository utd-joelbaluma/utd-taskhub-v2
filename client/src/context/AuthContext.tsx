import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { User } from "@/types/user";
import {
	getMe,
	loginWithEmail,
	logout as logoutService,
} from "@/services/auth.service";

interface AuthState {
	user: User | null;
	loading: boolean;
}

interface AuthContextValue extends AuthState {
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({ user: null, loading: true });

	const loadUser = useCallback(async () => {
		const token = localStorage.getItem("access_token");
		if (!token) {
			setState({ user: null, loading: false });
			return;
		}
		try {
			const user = await getMe();
			setState({ user, loading: false });
		} catch {
			localStorage.removeItem("access_token");
			localStorage.removeItem("refresh_token");
			setState({ user: null, loading: false });
		}
	}, []);

	useEffect(() => {
		loadUser();
	}, [loadUser]);

	const login = useCallback(async (email: string, password: string) => {
		const data = await loginWithEmail(email, password);
		localStorage.setItem("access_token", data.access_token);
		localStorage.setItem("refresh_token", data.refresh_token);
		setState({ user: data.user, loading: false });
	}, []);

	const logout = useCallback(async () => {
		await logoutService();
		setState({ user: null, loading: false });
	}, []);

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				logout,
				isAuthenticated: !!state.user,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
