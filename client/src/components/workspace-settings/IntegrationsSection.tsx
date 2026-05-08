import { MessageSquare, GitBranch, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionBlock } from "./SectionBlock";

const integrations = [
	{
		id: "slack",
		name: "Slack",
		description: "Get notifications and update tasks from channels.",
		icon: MessageSquare,
		linked: false,
	},
	{
		id: "github",
		name: "GitHub",
		description: "Sync pull requests with workspace tickets.",
		icon: GitBranch,
		linked: true,
	},
	{
		id: "jira",
		name: "Jira Sync",
		description: "Bi-directional sync for enterprise boards.",
		icon: AlertTriangle,
		linked: false,
	},
];

export function IntegrationsSection() {
	return (
		<SectionBlock
			title="Integrations"
			description="Connect your favorite tools to automate your workflow."
		>
			<div className="grid grid-cols-3 gap-4">
				{integrations.map(({ id, name, description, icon: Icon, linked }) => (
					<div
						key={id}
						className="rounded-lg border border-border p-4 flex flex-col gap-3 bg-surface"
					>
						<div className="h-9 w-9 rounded-lg bg-muted-subtle flex items-center justify-center">
							<Icon className="h-4 w-4 text-muted-foreground" />
						</div>
						<div className="flex-1">
							<p className="text-sm font-medium text-foreground">{name}</p>
							<p className="text-xs text-muted mt-0.5 leading-4">{description}</p>
						</div>
						<Button variant={linked ? "default" : "outline"} size="sm" className="w-full">
							{linked ? "Linked" : "Connect"}
						</Button>
					</div>
				))}
			</div>

			<div className="mt-4 rounded-lg bg-foreground overflow-hidden relative flex items-center justify-between px-6 py-4">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary" />
					<div className="absolute right-16 top-2 h-16 w-16 rounded-full bg-primary-subtle" />
				</div>
				<p className="text-sm font-semibold text-white relative z-10">
					Unlock 20+ more power-ups for your dev team.
				</p>
				<div className="relative z-10 flex items-center gap-2">
					<span className="text-xl font-bold text-white tracking-tight">TaskHub</span>
					<Button
						size="sm"
						variant="outline"
						className="bg-white/10 border-white/20 text-white hover:bg-white/20"
					>
						Explore
					</Button>
				</div>
			</div>
		</SectionBlock>
	);
}
