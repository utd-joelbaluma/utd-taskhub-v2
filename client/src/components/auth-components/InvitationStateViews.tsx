import { Link } from "react-router-dom";
import { Loader2, XCircle } from "lucide-react";

export function InvitationLoading() {
	return (
		<div className="flex flex-col items-center gap-3 py-12 text-muted">
			<Loader2 className="h-8 w-8 animate-spin" />
			<p className="text-sm">Verifying your invitation…</p>
		</div>
	);
}

type ErrorProps = { message: string };

export function InvitationError({ message }: ErrorProps) {
	return (
		<div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
			<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
				<XCircle className="h-6 w-6 text-danger" />
			</div>
			<h1 className="mb-2 text-lg font-semibold text-foreground">
				Invitation unavailable
			</h1>
			<p className="mb-6 text-sm text-muted">{message}</p>
			<Link
				to="/login"
				className="text-sm font-medium text-primary hover:underline"
			>
				Go to sign in
			</Link>
		</div>
	);
}
