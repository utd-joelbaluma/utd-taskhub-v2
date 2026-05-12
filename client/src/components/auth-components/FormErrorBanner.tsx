type Props = { message: string | null | undefined };

export function FormErrorBanner({ message }: Props) {
	if (!message) return null;
	return (
		<div className="rounded-lg border border-danger/20 bg-danger-subtle px-4 py-3 text-sm text-danger">
			{message}
		</div>
	);
}
