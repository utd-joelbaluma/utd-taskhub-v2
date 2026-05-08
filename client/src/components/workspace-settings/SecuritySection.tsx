import { useState } from "react";
import { Shield, Key } from "lucide-react";
import { SectionBlock, Toggle } from "./SectionBlock";

export function SecuritySection() {
	const [twoFactor, setTwoFactor] = useState(true);

	return (
		<SectionBlock
			title="Security & Access"
			description="Ensure your data and account remain protected."
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between py-3 border-b border-border">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
							<Shield className="h-4 w-4 text-primary" />
						</div>
						<div>
							<p className="text-sm font-medium text-foreground">
								Two-Factor Authentication
							</p>
							<p className="text-xs text-muted mt-0.5">
								Protect your account with an extra layer.
							</p>
						</div>
					</div>
					<Toggle checked={twoFactor} onChange={() => setTwoFactor((v) => !v)} />
				</div>

				<div className="flex items-center justify-between py-3">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-muted-subtle flex items-center justify-center shrink-0">
							<Key className="h-4 w-4 text-muted-foreground" />
						</div>
						<div>
							<p className="text-sm font-medium text-foreground">API Access Tokens</p>
							<p className="text-xs text-muted mt-0.5">
								Manage keys for custom tool development.
							</p>
						</div>
					</div>
					<button className="text-sm font-medium text-primary hover:underline">
						Manage Keys
					</button>
				</div>
			</div>
		</SectionBlock>
	);
}
