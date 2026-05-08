import { Link } from "react-router-dom";
import { LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PublicPageLayout from "@/pages/PublicPageLayout";

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL ?? "support@taskhub.app";

const contactOptions = [
	{
		title: "Workspace support",
		description:
			"Get help with account access, invitations, roles, projects, tasks, and tickets.",
		icon: LifeBuoy,
	},
	{
		title: "Security reports",
		description:
			"Report suspected abuse, unauthorized access, or security concerns for a workspace.",
		icon: ShieldCheck,
	},
	{
		title: "Product questions",
		description:
			"Ask about TaskHub setup, onboarding, and ways to fit the app into your team workflow.",
		icon: Mail,
	},
];

export default function ContactPage() {
	return (
		<PublicPageLayout
			eyebrow="Contact"
			title="Contact us"
			description="Reach the TaskHub team for support, security concerns, and product questions. Include your workspace name and the email address tied to your account when possible."
		>
			<div className="grid gap-4 md:grid-cols-3">
				{contactOptions.map((option) => {
					const Icon = option.icon;

					return (
						<Card key={option.title} className="p-5">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
								<Icon className="h-5 w-5" />
							</div>
							<h2 className="text-base font-semibold text-foreground">
								{option.title}
							</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								{option.description}
							</p>
						</Card>
					);
				})}
			</div>

			<section className="mt-8 border-t border-border pt-8">
				<div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
					<div>
						<h2 className="text-xl font-semibold tracking-tight text-foreground">
							Send a message
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
							Email is the best way to reach us right now. We
							recommend including your workspace name, a short
							description of the issue, and any relevant task,
							ticket, or project ID.
						</p>
						<div className="mt-5 flex flex-wrap gap-3">
							<Button asChild>
								<a href={`mailto:${supportEmail}`}>
									<Mail className="h-4 w-4" />
									Email support
								</a>
							</Button>
							<Button variant="outline" asChild>
								<Link to="/login">Sign in to TaskHub</Link>
							</Button>
						</div>
					</div>

					<div className="rounded-lg border border-border bg-surface p-5">
						<p className="text-sm font-semibold text-foreground">
							Support email
						</p>
						<a
							href={`mailto:${supportEmail}`}
							className="mt-2 block break-all text-sm text-primary hover:underline"
						>
							{supportEmail}
						</a>
						<p className="mt-4 text-xs leading-5 text-muted-foreground">
							Set VITE_SUPPORT_EMAIL to update this address for
							your deployment.
						</p>
					</div>
				</div>
			</section>
		</PublicPageLayout>
	);
}
