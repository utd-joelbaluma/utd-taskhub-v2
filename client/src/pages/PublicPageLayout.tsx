import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type PublicPageLayoutProps = {
	children: React.ReactNode;
	eyebrow: string;
	title: string;
	description: string;
};

export default function PublicPageLayout({
	children,
	eyebrow,
	title,
	description,
}: PublicPageLayoutProps) {
	return (
		<div className="min-h-svh bg-background">
			<header className="border-b border-border bg-surface">
				<div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
					<Link
						to="/"
						aria-label="TaskHub home"
						className="flex min-w-0 items-center"
					>
						<img
							src="/logo.svg"
							alt="TaskHub"
							className="h-8 w-auto max-w-[132px]"
						/>
					</Link>
					<Button variant="outline" size="sm" asChild>
						<Link to="/login">
							<ArrowLeft className="h-4 w-4" />
							Sign in
						</Link>
					</Button>
				</div>
			</header>

			<main className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 sm:py-14">
				<div className="mb-10 max-w-3xl">
					<p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-primary">
						{eyebrow}
					</p>
					<h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						{title}
					</h1>
					<p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
						{description}
					</p>
				</div>

				{children}
			</main>

			<footer className="border-t border-border bg-surface">
				<div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-6 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
					<p className="text-muted-foreground">
						© 2026 TaskHub. All rights reserved.
					</p>
					<nav
						aria-label="Legal navigation"
						className="flex flex-wrap gap-x-5 gap-y-2"
					>
						<Link
							to="/terms"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Terms
						</Link>
						<Link
							to="/privacy"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Privacy
						</Link>
						<Link
							to="/contact"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Contact
						</Link>
					</nav>
				</div>
			</footer>
		</div>
	);
}
