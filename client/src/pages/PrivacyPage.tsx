import PublicPageLayout from "@/pages/PublicPageLayout";

const sections = [
	{
		title: "Information we collect",
		items: [
			"Account details such as name, email address, role, and workspace membership.",
			"Workspace content such as projects, tasks, tickets, comments, invitations, and settings.",
			"Technical details such as device, browser, IP address, request logs, and security events.",
		],
	},
	{
		title: "How we use information",
		items: [
			"Provide and secure the TaskHub service.",
			"Authenticate users and enforce role-based permissions.",
			"Send account, invitation, product, and security notifications.",
			"Improve reliability, performance, support, and product workflows.",
		],
	},
	{
		title: "Sharing and processors",
		items: [
			"We do not sell workspace data.",
			"We may share data with trusted infrastructure, email, analytics, and support providers only as needed to operate TaskHub.",
			"We may disclose information if required by law or to protect users, workspaces, and the service.",
		],
	},
	{
		title: "Security and retention",
		items: [
			"We use technical and organizational safeguards designed to protect account and workspace information.",
			"Workspace data is kept while your account or workspace remains active, unless deletion is requested or retention is required by law.",
		],
	},
	{
		title: "Your choices",
		items: [
			"You may request access, correction, export, or deletion of personal information where applicable.",
			"Workspace administrators can manage member access, roles, invitations, and related settings.",
		],
	},
];

export default function PrivacyPage() {
	return (
		<PublicPageLayout
			eyebrow="Privacy"
			title="Privacy Policy"
			description="This policy explains what information TaskHub handles, how it is used, and the choices available to users and workspace administrators."
		>
			<div className="grid gap-5 lg:grid-cols-[260px_1fr]">
				<aside className="h-fit border-l-2 border-primary px-4 py-2 text-sm text-muted-foreground">
					<p className="font-medium text-foreground">Last updated</p>
					<p>May 8, 2026</p>
				</aside>

				<div className="space-y-6">
					{sections.map((section) => (
						<section
							key={section.title}
							className="border-b border-border pb-6 last:border-b-0"
						>
							<h2 className="text-lg font-semibold text-foreground">
								{section.title}
							</h2>
							<ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
								{section.items.map((item) => (
									<li key={item} className="flex gap-3">
										<span
											className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
											aria-hidden="true"
										/>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			</div>
		</PublicPageLayout>
	);
}
