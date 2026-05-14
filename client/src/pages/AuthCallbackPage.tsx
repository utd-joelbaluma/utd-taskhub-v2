import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
	oauth_failed: "Google sign-in was cancelled or failed. Please try again.",
	account_disabled: "Your account has been disabled.",
	profile_missing: "We couldn't find a profile for this account.",
};

function parseFragment(hash: string): Record<string, string> {
	const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
	const params = new URLSearchParams(trimmed);
	const out: Record<string, string> = {};
	params.forEach((value, key) => {
		out[key] = value;
	});
	return out;
}

export default function AuthCallbackPage() {
	const navigate = useNavigate();
	const { establishSession } = useAuth();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const ranRef = useRef(false);

	useEffect(() => {
		if (ranRef.current) return;
		ranRef.current = true;

		const queryParams = new URLSearchParams(window.location.search);
		const errorCode = queryParams.get("error");
		if (errorCode) {
			const message = ERROR_MESSAGES[errorCode] ?? "Sign-in failed.";
			setErrorMessage(message);
			toast.error(message);
			const timeout = window.setTimeout(() => {
				navigate("/login", { replace: true });
			}, 1500);
			return () => window.clearTimeout(timeout);
		}

		const fragment = parseFragment(window.location.hash);
		const accessToken = fragment.access_token;
		const refreshToken = fragment.refresh_token;
		const expiresAtRaw = fragment.expires_at;

		if (!accessToken || !refreshToken) {
			const message = "Sign-in response was incomplete. Please try again.";
			setErrorMessage(message);
			toast.error(message);
			const timeout = window.setTimeout(() => {
				navigate("/login", { replace: true });
			}, 1500);
			return () => window.clearTimeout(timeout);
		}

		const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : undefined;

		window.history.replaceState(
			null,
			"",
			`${window.location.pathname}${window.location.search}`,
		);

		(async () => {
			try {
				await establishSession(
					{
						access_token: accessToken,
						refresh_token: refreshToken,
						expires_at: Number.isFinite(expiresAt)
							? expiresAt
							: undefined,
					},
					true,
				);
				toast.success("Signed in with Google.");
				navigate("/", { replace: true });
			} catch {
				const message = "Could not load your profile. Please sign in again.";
				setErrorMessage(message);
				toast.error(message);
				window.setTimeout(() => {
					navigate("/login", { replace: true });
				}, 1500);
			}
		})();
	}, [establishSession, navigate]);

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-4">
			<div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-sm">
				{errorMessage ? (
					<>
						<h1 className="mb-2 text-lg font-semibold text-foreground">
							Sign-in failed
						</h1>
						<p className="text-sm text-muted">{errorMessage}</p>
						<p className="mt-4 text-xs text-muted">
							Redirecting you back to the login page…
						</p>
					</>
				) : (
					<>
						<div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
						<h1 className="mb-1 text-lg font-semibold text-foreground">
							Completing sign-in
						</h1>
						<p className="text-sm text-muted">
							Hold on while we finish signing you in.
						</p>
					</>
				)}
			</div>
		</div>
	);
}
