import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DangerZoneSection() {
	return (
		<Card className="p-6 border-danger/30">
			<div className="mb-5">
				<h2 className="text-base font-semibold text-danger">Danger Zone</h2>
				<p className="text-xs text-muted mt-0.5">Irreversible and destructive actions.</p>
			</div>
			<div className="space-y-4">
				<div className="flex items-center justify-between py-3 border border-danger/20 rounded-lg px-4 bg-danger-subtle/40">
					<div>
						<p className="text-sm font-medium text-foreground">Delete Workspace</p>
						<p className="text-xs text-muted mt-0.5">
							Permanently delete this workspace and all its data.
						</p>
					</div>
					<Button variant="destructive" size="sm">
						Delete Workspace
					</Button>
				</div>
			</div>
		</Card>
	);
}
