import type { ReactNode } from "react";
import { useState } from "react";
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Undo2,
	Redo2,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
} from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	FORMAT_TEXT_COMMAND,
	FORMAT_ELEMENT_COMMAND,
	UNDO_COMMAND,
	REDO_COMMAND,
	type EditorState,
} from "lexical";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	makeInitialEditorState,
	parseLexicalDescription,
	type SerializedDescriptionNode,
} from "./project-description-utils";

function renderText(node: SerializedDescriptionNode, key: string): ReactNode {
	const text = node.text ?? "";
	const format = node.format ?? 0;
	return (
		<span
			key={key}
			className={cn(
				format & 1 ? "font-semibold" : "",
				format & 2 ? "italic" : "",
				format & 8 ? "underline" : "",
				format & 4 ? "line-through" : "",
				format & 16
					? "rounded bg-muted-subtle px-1 font-mono text-[0.95em]"
					: "",
			)}
		>
			{text}
		</span>
	);
}

function renderNode(node: SerializedDescriptionNode, key: string): ReactNode {
	if (typeof node.text === "string") return renderText(node, key);
	if (!Array.isArray(node.children)) return null;

	const children = node.children.map((child, index) =>
		renderNode(child, `${key}-${index}`),
	);
	if (node.type === "paragraph") {
		return (
			<p key={key} className="mb-2 last:mb-0">
				{children}
			</p>
		);
	}

	return <span key={key}>{children}</span>;
}

export function ProjectDescriptionPreview({
	value,
	className,
	fallback = "No description.",
}: {
	value: string | null | undefined;
	className?: string;
	fallback?: string;
}) {
	if (!value) return <span className={className}>{fallback}</span>;
	const parsed = parseLexicalDescription(value);
	if (!parsed) {
		return <span className={className}>{value}</span>;
	}

	const children = parsed.root.children?.map((child, index) =>
		renderNode(child, String(index)),
	);
	return <div className={className}>{children}</div>;
}

function ToolbarButton({
	label,
	active,
	onClick,
	children,
}: {
	label: string;
	active?: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<Button
			type="button"
			variant={active ? "default" : "outline"}
			size="icon"
			onClick={onClick}
			aria-label={label}
			className="h-8 w-8 !rounded-xs"
		>
			{children}
		</Button>
	);
}

function ToolbarSeparator() {
	return <div className="mx-1 h-5 w-px bg-border" />;
}

function DescriptionToolbar() {
	const [editor] = useLexicalComposerContext();

	return (
		<div className="flex items-center gap-1 border-b border-border bg-muted-subtle/40 px-2 py-2">
			<ToolbarButton
				label="Undo"
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
			>
				<Undo2 className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Redo"
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
			>
				<Redo2 className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarSeparator />
			<ToolbarButton
				label="Bold"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
				}
			>
				<Bold className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Italic"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
				}
			>
				<Italic className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Underline"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
				}
			>
				<Underline className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Strikethrough"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
				}
			>
				<Strikethrough className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarSeparator />
			<ToolbarButton
				label="Align Left"
				onClick={() =>
					editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
				}
			>
				<AlignLeft className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Align Center"
				onClick={() =>
					editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
				}
			>
				<AlignCenter className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Align Right"
				onClick={() =>
					editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
				}
			>
				<AlignRight className="h-3.5 w-3.5" />
			</ToolbarButton>
			<ToolbarButton
				label="Align Justify"
				onClick={() =>
					editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
				}
			>
				<AlignJustify className="h-3.5 w-3.5" />
			</ToolbarButton>
		</div>
	);
}

export function ProjectDescriptionEditor({
	value,
	onChange,
	placeholder = "Describe the project goals and scope...",
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}) {
	const [initialConfig] = useState(() => ({
		namespace: "ProjectDescription",
		editorState: makeInitialEditorState(value),
		onError(error: Error) {
			throw error;
		},
		theme: {
			text: {
				bold: "font-semibold",
				italic: "italic",
				underline: "underline",
				strikethrough: "line-through",
				code: "rounded bg-muted-subtle px-1 font-mono text-[0.95em]",
			},
		},
	}));

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="overflow-hidden rounded-lg border border-border-strong bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
				<DescriptionToolbar />
				<div className="relative">
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								aria-placeholder={placeholder}
								placeholder={
									<div className="pointer-events-none absolute left-3 top-3 text-sm text-muted">
										{placeholder}
									</div>
								}
								className="min-h-50 w-full resize-none px-3 py-2 text-sm leading-relaxed text-foreground outline-none"
							/>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
				</div>
				<HistoryPlugin />
				<OnChangePlugin
					onChange={(editorState: EditorState) => {
						onChange(JSON.stringify(editorState.toJSON()));
					}}
				/>
			</div>
		</LexicalComposer>
	);
}
