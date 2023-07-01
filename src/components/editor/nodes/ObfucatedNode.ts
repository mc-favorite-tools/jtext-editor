/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $setSelection, EditorConfig, LexicalNode, NodeKey, SerializedTextNode, Spread, TextNode } from "lexical";

export type SerializedObfuscatedNode = Spread<
  {
    type: 'obfuscated';
  },
  SerializedTextNode
>;

export class ObfuscatedNode extends TextNode {


    static getType(): string {
        return 'obfuscated'
    }

    static clone(node: TextNode): TextNode {
        return new ObfuscatedNode(node.__text, node.__format, node.__style, node.__key)
    }

    constructor(text: string, format: number, style: string, key?: NodeKey) {
        super(text, key);
        this.__format = format
        this.__style = style
    }

    createDOM(config: EditorConfig): HTMLElement {
        // const dom = super.createDOM(config)
        // dom.className = 'jtp__obfuscated'
        // return dom
        const dom = document.createElement('span')
        dom.className = 'jtp__obfuscated'

        const selection = $getSelection()
        // const [editor] = useLexicalComposerContext()
        if ($isRangeSelection(selection)) {
            selection.extract().forEach(node => {

                const text = node.getTextContent()

                for (let i = 0; i < text.length; i++) {
                    const ch = text[i];
                    const inner = document.createElement('span')
                    inner.innerText = ch
                    inner.classList.add('jtp__obfuscated-item')
                    dom.appendChild(inner)
                }

            })
        }
        
        return dom
    }

    // updateDOM(prevNode: TextNode, dom: HTMLElement, config: EditorConfig): boolean {
    //     super.updateDOM(prevNode, dom, config)
    //     return false
    // }

    static importJSON(serializedNode: SerializedObfuscatedNode): ObfuscatedNode {
        const node = $createObfuscatedNode(serializedNode.text, serializedNode.format, serializedNode.style)
        // node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        // node.setStyle(serializedNode.style);
        return node
    }

    exportJSON(): SerializedObfuscatedNode {
        return {
            ...super.exportJSON(),
            type: 'obfuscated'
        }
    }
}

export function $isObfuscatedNode(node: LexicalNode | null | undefined) {
    return node instanceof ObfuscatedNode
}

export function $createObfuscatedNode(text: string, format: number, style: string) {
    return new ObfuscatedNode(text, format, style)
}