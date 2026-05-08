import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SectionBlock } from "./SectionBlock";

export function GeneralSection() {
	return (
		<SectionBlock
			title="General Settings"
			description="Update your basic workspace information."
		>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
						Workspace Name
					</label>
					<Input defaultValue="TaskHub HQ" />
				</div>
				<div>
					<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
						Workspace URL
					</label>
					<div className="flex items-center gap-0">
						<span className="h-9 flex items-center px-3 text-sm text-muted border border-r-0 border-border-strong bg-muted-subtle rounded-l-lg whitespace-nowrap">
							taskhub.io/
						</span>
						<Input defaultValue="hq" className="rounded-l-none" />
					</div>
				</div>
				<div>
					<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
						Time Zone
					</label>
					<Select defaultValue="pacific">
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pacific">(GMT-08:00) Pacific Time</SelectItem>
							<SelectItem value="mountain">(GMT-07:00) Mountain Time</SelectItem>
							<SelectItem value="central">(GMT-06:00) Central Time</SelectItem>
							<SelectItem value="eastern">(GMT-05:00) Eastern Time</SelectItem>
							<SelectItem value="utc">(GMT+00:00) UTC</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
						Language
					</label>
					<Select defaultValue="en-us">
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="en-us">English (US)</SelectItem>
							<SelectItem value="en-gb">English (UK)</SelectItem>
							<SelectItem value="fr">French</SelectItem>
							<SelectItem value="de">German</SelectItem>
							<SelectItem value="es">Spanish</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="mt-5 flex justify-end">
				<Button size="sm">Save Changes</Button>
			</div>
		</SectionBlock>
	);
}
