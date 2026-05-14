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
import {
	clearStoredAuth,
	getStoredAccessToken,
	getStoredRefreshToken,
	storeAuthTokens,
} from "@/lib/auth-storage";

interface AuthState {
	user: User | null;
	loading: boolean;
}

interface OAuthTokens {
	access_token: string;
	refresh_token: string;
	expires_at?: number;
}

interface AuthContextValue extends AuthState {
	login: (email: string, password: string, remember?: boolean) => Promise<void>;
	establishSession: (tokens: OAuthTokens, remember?: boolean) => Promise<void>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({ user: null, loading: true });

	const loadUser = useCallback(async () => {
		const token = getStoredAccessToken();
		const refreshToken = getStoredRefreshToken();
		if (!token && !refreshToken) {
			setState({ user: null, loading: false });
			return;
		}
		try {
			const user = await getMe();
			setState({ user, loading: false });
		} catch {
			clearStoredAuth();
			setState({ user: null, loading: false });
		}
	}, []);

	useEffect(() => {
		loadUser();
	}, [loadUser]);

	const login = useCallback(
		async (email: string, password: string, remember = false) => {
			const data = await loginWithEmail(email, password);
			storeAuthTokens(data, { remember });
			setState({ user: data.user, loading: false });
		},
		[],
	);

	const establishSession = useCallback(
		async (tokens: OAuthTokens, remember = false) => {
			storeAuthTokens(tokens, { remember });
			try {
				const user = await getMe();
				setState({ user, loading: false });
			} catch (err) {
				clearStoredAuth();
				setState({ user: null, loading: false });
				throw err;
			}
		},
		[],
	);

	const logout = useCallback(async () => {
		await logoutService();
		setState({ user: null, loading: false });
	}, []);

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				establishSession,
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
