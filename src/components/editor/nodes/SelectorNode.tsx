import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_HIGH, DecoratorNode, EditorConfig, FORMAT_TEXT_COMMAND, LexicalEditor, LexicalNode, NodeKey, SELECTION_CHANGE_COMMAND, SerializedLexicalNode, Spread } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Wrapper = styled.span`
    .selector__input {
        outline: none;
        width: 100px;
        padding: 0;
    }
`

export function SelectorComponent(props: {
    nodeKey: NodeKey;
    text: string
}) {
    const [editor] = useLexicalComposerContext()
    const [showEditor, setShowEditor] = useState(false)
    const [value, setValue] = useState(props.text)
    const inputRef = useRef<HTMLInputElement>(null)

    const onHide = useCallback(
        (restoreSelection?: boolean) => {
            setShowEditor(false);
            editor.update(() => {
                const node = $getNodeByKey(props.nodeKey)!
                if ($isSelectNode(node)) {
                    node.setText(value)
                    if (restoreSelection) {
                        node.selectNext(0, 0)
                    }
                }
            });
        },
        [editor, value, props.nodeKey],
    )

    useEffect(() => {
        if (showEditor) {
            return mergeRegister(
                editor.registerCommand(
                    SELECTION_CHANGE_COMMAND,
                    () => {
                        const activeElement = document.activeElement
                        const inputElem = inputRef.current
                        if (inputElem !== activeElement) {
                            onHide()
                        }
                        return false
                    },
                    COMMAND_PRIORITY_HIGH
                )
            )
        }
    }, [editor, showEditor, onHide])
    
    
    return (
        <Wrapper>
            {
                showEditor
                    ? (
                        <input className="selector__input" ref={inputRef} value={value} onChange={(e) => {
                            setValue(e.target.value)
                        }} />
                    )
                    : (
                        <span onClick={() => {
                            setShowEditor(true)
                        }}>{props.text}</span>
                    )
            }
        </Wrapper>
    )
}

export type SerializedSelectorNode = Spread<
    {
        type: 'selector';
        text: string;
    },
    SerializedLexicalNode
>;

export class SelectorNode extends DecoratorNode<JSX.Element> {
    __text: string

    static getType(): string {
        return 'selector'
    }

    static clone(node: SelectorNode) {
        return new SelectorNode(node.__text, node.__key)
    }

    constructor(text: string, key?: NodeKey) {
        super(key);
        this.__text = text;
    }

    static importJSON(serializedNode: SerializedSelectorNode): SelectorNode {
        const node = $createSelectorNode(serializedNode.text)
        return node
    }

    createDOM(_config: EditorConfig): HTMLElement {
        return document.createElement('span')
    }

    exportJSON(): SerializedSelectorNode {
        return {
            text: this.__text,
            type: 'selector',
            version: 1,
        }
    }

    setText(text: string) {
        const writable = this.getWritable();
        writable.__text = text;
    }

    decorate(): JSX.Element {
        return (
            <SelectorComponent nodeKey={this.__key} text={this.__text} />
        )
    }
}

export function $createSelectorNode(text: string) {
    return new SelectorNode(text)
}

export function $isSelectNode(node: LexicalNode | null | undefined) {
    return node instanceof SelectorNode
}