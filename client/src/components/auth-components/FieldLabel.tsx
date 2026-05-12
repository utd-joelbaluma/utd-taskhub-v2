type Props = {
	htmlFor: string;
	children: React.ReactNode;
};

export function FieldLabel({ htmlFor, children }: Props) {
	return (
		<label
			htmlFor={htmlFor}
			className="block text-sm font-medium text-muted-foreground mb-1.5"
		>
			{children}
		</label>
	);
}
