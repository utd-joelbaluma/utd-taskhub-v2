import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { storeAuthTokens } from "@/lib/auth-storage";
import { acceptInvitation } from "@/services/invitation.service";
import {
	registerUser,
	loginWithEmail,
	completeInvite,
} from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import {
	InvitationLoading,
	InvitationError,
} from "@/components/auth-components/InvitationStateViews";
import {
	CompleteAccountForm,
	type CompleteAccountValues,
} from "@/components/auth-components/CompleteAccountForm";
import {
	RegisterInviteForm,
	type RegisterInviteValues,
} from "@/components/auth-components/RegisterInviteForm";
import {
	InviteLoginForm,
	type InviteLoginValues,
} from "@/components/auth-components/InviteLoginForm";

type PageState =
	| "loading"
	| "requires_registration"
	| "complete_account"
	| "success"
	| "error";

type InviteSession = {
	access_token: string;
	refresh_token: string;
};

export default function AcceptInvitationPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();

	const token = searchParams.get("token") ?? "";

	const [pageState, setPageState] = useState<PageState>("loading");
	const [invitedEmail, setInvitedEmail] = useState("");
	const [invitedRole, setInvitedRole] = useState("");
	const [statusMessage, setStatusMessage] = useState("");

	const [inviteSession, setInviteSession] = useState<InviteSession | null>(
		null,
	);

	const [registerLoading, setRegisterLoading] = useState(false);
	const [registerError, setRegisterError] = useState("");

	const [completeLoading, setCompleteLoading] = useState(false);
	const [completeError, setCompleteError] = useState("");

	const [loginLoading, setLoginLoading] = useState(false);
	const [loginError, setLoginError] = useState("");

	useEffect(() => {
		if (!token) {
			setStatusMessage(
				"No invitation token found. Check your invitation link.",
			);
			setPageState("error");
			return;
		}

		const hash = new URLSearchParams(window.location.hash.slice(1));
		const hashType = hash.get("type");
		const hashAccessToken = hash.get("access_token");
		const hashRefreshToken = hash.get("refresh_token");

		if (hashType === "invite" && hashAccessToken && hashRefreshToken) {
			setInviteSession({
				access_token: hashAccessToken,
				refresh_token: hashRefreshToken,
			});
		}

		acceptInvitation(token)
			.then((res) => {
				setInvitedEmail(res.data?.email ?? "");
				setInvitedRole(res.data?.role ?? "");
				if (res.requires_registration) {
					setPageState("requires_registration");
				} else if (hashType === "invite" && hashAccessToken) {
					setPageState("complete_account");
				} else {
					setStatusMessage(res.message);
					setPageState("success");
				}
			})
			.catch((err: Error) => {
				setStatusMessage(err.message);
				setPageState("error");
			});
	}, [token]);

	useEffect(() => {
		if (!(isAuthenticated && pageState === "success")) return;
		const timer = setTimeout(() => {
			navigate("/");
		}, 2000);
		return () => clearTimeout(timer);
	}, [isAuthenticated, pageState, navigate]);

	async function handleRegister(values: RegisterInviteValues) {
		setRegisterError("");
		setRegisterLoading(true);
		try {
			await registerUser(
				invitedEmail,
				values.password,
				values.name.trim(),
				invitedRole,
			);
			await acceptInvitation(token);
			const session = await loginWithEmail(invitedEmail, values.password);
			storeAuthTokens(session, { remember: false });
			navigate("/");
		} catch (err) {
			setRegisterError(
				err instanceof Error ? err.message : "Something went wrong.",
			);
		} finally {
			setRegisterLoading(false);
		}
	}

	async function handleComplete(values: CompleteAccountValues) {
		setCompleteError("");

		if (!inviteSession) {
			setCompleteError(
				"Invite session expired. Please request a new invitation.",
			);
			return;
		}

		setCompleteLoading(true);
		try {
			storeAuthTokens(inviteSession, { remember: false });
			await completeInvite(
				values.name.trim(),
				values.password,
				invitedRole || undefined,
			);
			console.log("inviteSession", inviteSession);
			// const session = await loginWithEmail(invitedEmail, values.password);
			// storeAuthTokens(session, { remember: true });
			// setTimeout(() => {
			// 	navigate("/", {
			// 		state: { toast: "Welcome! Account successfully set up!" },
			// 	});
			// }, 1500);
		} catch (err) {
			setCompleteError(
				err instanceof Error ? err.message : "Something went wrong.",
			);
		} finally {
			setTimeout(() => {
				// setCompleteLoading(false);
			}, 2000);
		}
	}

	async function handleLogin(values: InviteLoginValues) {
		setLoginError("");
		setLoginLoading(true);
		try {
			const session = await loginWithEmail(values.email, values.password);
			storeAuthTokens(session, { remember: false });
			navigate("/");
		} catch (err) {
			setLoginError(
				err instanceof Error
					? err.message
					: "Invalid email or password.",
			);
		} finally {
			setLoginLoading(false);
		}
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
			<div className="w-full max-w-[420px]">
				<Link
					to="/"
					aria-label="TaskHub home"
					className="flex items-center justify-center mb-8"
				>
					<img src="/favicon.svg" alt="TaskHub" className="h-9 w-9" />
					<span className="ml-2 text-lg font-bold tracking-tight text-foreground">
						TaskHub
					</span>
				</Link>

				{pageState === "loading" && <InvitationLoading />}

				{pageState === "error" && (
					<InvitationError message={statusMessage} />
				)}

				{pageState === "complete_account" && (
					<CompleteAccountForm
						loading={completeLoading}
						error={completeError}
						onSubmit={handleComplete}
					/>
				)}

				{pageState === "success" && (
					<InviteLoginForm
						statusMessage={statusMessage}
						loading={loginLoading}
						error={loginError}
						onSubmit={handleLogin}
					/>
				)}

				{pageState === "requires_registration" && (
					<RegisterInviteForm
						invitedEmail={invitedEmail}
						loading={registerLoading}
						error={registerError}
						onSubmit={handleRegister}
					/>
				)}
			</div>
		</div>
	);
}
