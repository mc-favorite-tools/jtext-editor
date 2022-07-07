import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

function correct(code: number) {
    const [a, b] = [0x0100, 0x024f]
    // const [a, b] = [0x021, 0x04AF]
    return (code + a) % (b - a) + a
}

const WrapperSpan = styled.span`
    overflow: hidden;
    display: block;
    position: absolute;
    pointer-events: none;
    font-family: Minecraft;
    font-size: 16px;
    /* background-color: #fff; */
`

interface ObfuscateNodeProps {
    top: number;
    left: number;
    width: number;
    height: number;
    text: string;
    color: string;
}

function ObfuscateNode(props: ObfuscateNodeProps) {
    const timerRef = useRef()
    const nodeRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const node = nodeRef.current
        if (node) {
            setInterval(() => {
                let str = ''
                for (let i = 0; i < node.innerText.length; i++) {
                    const ch = node.innerText[i]
                    str += String.fromCharCode(correct(ch.charCodeAt(0) + 17))
                }
                node.innerText = str
            }, 1000 / 30)
        }
        return () => {
            clearInterval(timerRef.current)
        }
    }, [])

    const { text, ...rest } = props
    return (
        <WrapperSpan ref={nodeRef} style={{ ...rest }}>{text}</WrapperSpan>
    )
}

export default function ObfuscatedPlugin() {
    const [editor] = useLexicalComposerContext()
    const [rectList, setRectList] = useState<ObfuscateNodeProps[]>([])

    const update = () => {
        const nodes = document.querySelectorAll('sub')
        const result: ObfuscateNodeProps[] = []
        for (const node of nodes) {
            const text = node.innerText
            const styleColor = node.style.color
            const color = styleColor === 'transparent'
                ? node.dataset.color || node.style.color
                : node.style.color || '#000'
            node.dataset['color'] = color
            node.style.color = 'transparent'
            const rectList = node.getClientRects()
            for (const rect of rectList) {
                result.push({
                    top: rect.top - 4,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height + 2,
                    text: text,
                    color,
                })
            }
        }
        setRectList(result)
    }

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(() => {
                setTimeout(() => {
                    update()
                }, 0);
            })
        )
    }, [])
    
    useEffect(() => {
        window.addEventListener('resize', update)
        return () => {
            window.removeEventListener('resize', update)
        }
    }, [])

    return createPortal(
        <>
            {
                rectList.map((rect, index) => {
                    return (
                        <ObfuscateNode key={index} {...rect}></ObfuscateNode>
                    )
                })
            }
        </>,
        document.body
    )
}