import type { JSX } from "react";
import {
	DecoratorNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread,
} from "lexical";

export type SerializedImageNode = Spread<
	{
		src: string;
		alt: string;
	},
	SerializedLexicalNode
>;

function convertImageElement(domNode: HTMLElement): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLImageElement)) return null;
	const { src, alt } = domNode;
	if (!src) return null;
	const node = $createImageNode(src, alt);
	return { node };
}

export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__alt: string;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__alt, node.__key);
	}

	static importJSON(serialized: SerializedImageNode): ImageNode {
		return $createImageNode(serialized.src, serialized.alt);
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: () => ({ conversion: convertImageElement, priority: 0 }),
		};
	}

	constructor(src: string, alt: string, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__alt = alt;
	}

	exportJSON(): SerializedImageNode {
		return {
			type: "image",
			version: 1,
			src: this.__src,
			alt: this.__alt,
		};
	}

	exportDOM(): DOMExportOutput {
		const el = document.createElement("img");
		el.setAttribute("src", this.__src);
		el.setAttribute("alt", this.__alt);
		return { element: el };
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const span = document.createElement("span");
		span.style.display = "inline-block";
		span.style.maxWidth = "100%";
		return span;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): JSX.Element {
		return (
			<img
				src={this.__src}
				alt={this.__alt}
				className="max-w-full rounded-md border border-border my-1"
			/>
		);
	}
}

export function $createImageNode(src: string, alt = ""): ImageNode {
	return new ImageNode(src, alt);
}

export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node instanceof ImageNode;
}
