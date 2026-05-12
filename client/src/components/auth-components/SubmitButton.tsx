import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
	loading: boolean;
	loadingText: string;
	idleText: string;
};

export function SubmitButton({ loading, loadingText, idleText }: Props) {
	return (
		<Button type="submit" className="w-full" disabled={loading}>
			{loading ? (
				<span className="flex items-center gap-2">
					<span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
					{loadingText}
				</span>
			) : (
				<span className="flex items-center gap-2">
					{idleText} <ArrowRight className="h-4 w-4" />
				</span>
			)}
		</Button>
	);
}
