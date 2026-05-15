import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$insertNodes,
	COMMAND_PRIORITY_LOW,
	PASTE_COMMAND,
	$getSelection,
	$isRangeSelection,
} from "lexical";
import { $createImageNode } from "./ImageNode";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

export function ImagePastePlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(event) => {
				if (!(event instanceof ClipboardEvent)) return false;
				const items = event.clipboardData?.items;
				if (!items) return false;

				const imageFiles: File[] = [];
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					if (item.kind === "file" && item.type.startsWith("image/")) {
						const f = item.getAsFile();
						if (f) imageFiles.push(f);
					}
				}
				if (imageFiles.length === 0) return false;

				event.preventDefault();
				(async () => {
					for (const file of imageFiles) {
						if (file.size > MAX_IMAGE_BYTES) continue;
						const dataUrl = await readAsDataURL(file);
						editor.update(() => {
							const selection = $getSelection();
							if (!$isRangeSelection(selection)) return;
							$insertNodes([$createImageNode(dataUrl, file.name)]);
						});
					}
				})();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor]);

	return null;
}
