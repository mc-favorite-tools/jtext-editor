import { DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, SerializedTextNode, Spread } from 'lexical';
import { TextNode } from 'lexical';

export type SerializedEmojiNode = Spread<
  {
    type: 'nbt';
  },
  SerializedTextNode
>;

export class NbtNode extends TextNode {
    static getType(): string {
        return 'nbt'
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement('span')
        const inner = super.createDOM(config)
        dom.classList.add('textNbt')
        inner.classList.add('textNbt-item')
        dom.appendChild(inner)
        return dom
    }

    updateDOM(prevNode: TextNode, dom: HTMLElement, config: EditorConfig): boolean {
        console.log('updateDOM', prevNode, dom)
        return false
    }

    static importJSON(serializedNode: SerializedEmojiNode): NbtNode {
        const node = $createNbtNode(serializedNode.text)
        node.setFormat(serializedNode.format)
        node.setDetail(serializedNode.detail)
        node.setMode(serializedNode.mode)
        node.setStyle(serializedNode.style)
        return node
    }
    
    exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            type: 'nbt'
        }
    }
}

export function $isNbtNode(node: LexicalNode | null | undefined) {
    return node instanceof NbtNode
}

export function $createNbtNode(text: string) {
    return new NbtNode(text).setMode('token')
}