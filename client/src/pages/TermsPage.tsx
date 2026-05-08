import PublicPageLayout from "@/pages/PublicPageLayout";

const sections = [
	{
		title: "Use of TaskHub",
		body: "TaskHub is provided for managing projects, tasks, tickets, users, and related workspace activity. You are responsible for keeping your account credentials secure and for all activity performed through your account.",
	},
	{
		title: "Workspace content",
		body: "You retain ownership of the information you add to TaskHub, including projects, tasks, comments, attachments, and profile details. You grant TaskHub the limited permission needed to host, process, and display that content for your workspace.",
	},
	{
		title: "Acceptable use",
		body: "Do not use TaskHub to break the law, disrupt the service, attempt unauthorized access, upload malicious content, or interfere with other users or workspaces.",
	},
	{
		title: "Accounts and access",
		body: "Workspace owners and authorized administrators control invitations, roles, permissions, and member access. TaskHub may suspend access when required to protect users, data, or the service.",
	},
	{
		title: "Service changes",
		body: "TaskHub may update features, improve workflows, or change availability from time to time. We aim to keep changes practical and clearly communicated where they affect your workspace.",
	},
	{
		title: "Disclaimers",
		body: "TaskHub is provided as available. To the fullest extent allowed by law, TaskHub is not liable for indirect, incidental, special, consequential, or punitive damages.",
	},
];

export default function TermsPage() {
	return (
		<PublicPageLayout
			eyebrow="Terms"
			title="Terms of Service"
			description="These terms describe the basic rules for using TaskHub and the responsibilities that come with account and workspace access."
		>
			<div className="grid gap-5 lg:grid-cols-[260px_1fr]">
				<aside className="h-fit border-l-2 border-primary px-4 py-2 text-sm text-muted-foreground">
					<p className="font-medium text-foreground">Last updated</p>
					<p>May 8, 2026</p>
				</aside>

				<div className="space-y-5">
					{sections.map((section) => (
						<section
							key={section.title}
							className="border-b border-border pb-5 last:border-b-0"
						>
							<h2 className="text-lg font-semibold text-foreground">
								{section.title}
							</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								{section.body}
							</p>
						</section>
					))}
				</div>
			</div>
		</PublicPageLayout>
	);
}
