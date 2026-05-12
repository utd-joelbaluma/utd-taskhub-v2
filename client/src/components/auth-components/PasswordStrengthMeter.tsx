import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	passwordRules,
	getPasswordStrength,
	strengthLabels,
	strengthColors,
	strengthTextColors,
} from "./passwordRules";

type Props = { password: string };

export function PasswordStrengthMeter({ password }: Props) {
	if (!password) return null;

	const strength = getPasswordStrength(password);
	const label = strengthLabels[strength];

	return (
		<div className="mt-2">
			<div className="flex gap-1 mb-1.5">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className={cn(
							"h-1 flex-1 rounded-full transition-colors",
							i < strength ? strengthColors[strength] : "bg-border",
						)}
					/>
				))}
			</div>
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap gap-x-3 gap-y-1">
					{passwordRules.map((rule) => {
						const passed = rule.test(password);
						return (
							<span
								key={rule.label}
								className={cn(
									"flex items-center gap-1 text-[10px] transition-colors",
									passed ? "text-secondary" : "text-muted",
								)}
							>
								<Check
									className={cn(
										"h-2.5 w-2.5",
										passed ? "opacity-100" : "opacity-0",
									)}
								/>
								{rule.label}
							</span>
						);
					})}
				</div>
				{label && (
					<span
						className={cn(
							"shrink-0 text-[10px] font-medium",
							strengthTextColors[strength],
						)}
					>
						{label}
					</span>
				)}
			</div>
		</div>
	);
}
