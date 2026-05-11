// components/CustomSelect.tsx

import { Group, Image, Select, Text } from "@mantine/core";

import type { ComboboxItem } from "@mantine/core";
type SelectOption = ComboboxItem & {
	image?: string;
	description?: string;
	[key: string]: any;
};

type CustomSelectProps = {
	data: SelectOption[];

	value?: string | null;

	onChange?: (value: string | null) => void;

	label?: string;

	placeholder?: string;

	searchable?: boolean;

	clearable?: boolean;

	nothingFoundMessage?: string;

	renderOption?: (option: SelectOption) => React.ReactNode;

	renderSelected?: (option: SelectOption | undefined) => React.ReactNode;

	className?: string;

	size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export default function MantineSelect({
	data,
	value,
	onChange,
	label,
	placeholder = "Select option",
	searchable = true,
	clearable = false,
	nothingFoundMessage = "No results found",
	renderOption,
	renderSelected,
	className,
	size = "md",
}: CustomSelectProps) {
	const selectedOption = data.find((item) => item.value === value);

	return (
		<Select
			className={className}
			label={label}
			placeholder={placeholder}
			data={data}
			value={value}
			onChange={onChange}
			searchable={searchable}
			clearable={clearable}
			nothingFoundMessage={nothingFoundMessage}
			size={size}
			renderOption={({ option }) => {
				const typedOption = option as SelectOption;

				if (renderOption) {
					return renderOption(typedOption);
				}

				return (
					<Group gap="sm">
						{typedOption.image && (
							<Image
								src={typedOption.image}
								w={36}
								h={36}
								radius="xl"
							/>
						)}

						<div>
							<Text size="sm">{typedOption.label}</Text>

							{typedOption.description && (
								<Text size="xs" c="dimmed">
									{typedOption.description}
								</Text>
							)}
						</div>
					</Group>
				);
			}}
			valueComponent={() => {
				if (renderSelected) {
					return renderSelected(selectedOption);
				}

				if (!selectedOption) {
					return null;
				}

				return (
					<Group gap="sm">
						{selectedOption.image && (
							<Image
								src={selectedOption.image}
								w={24}
								h={24}
								radius="xl"
							/>
						)}

						<Text size="sm">{selectedOption.label}</Text>
					</Group>
				);
			}}
		/>
	);
}
