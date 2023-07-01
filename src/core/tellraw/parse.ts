/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import { $createMarkNode, $isMarkNode, MarkNode } from "@lexical/mark"
import { $createHorizontalRuleNode, HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"
import { $createParagraphNode, $createTextNode, $isParagraphNode, LexicalNode, NodeKey, ParagraphNode } from "lexical"
import { JSONEventProps, JSONProps, JSONTextProps } from "."
import { createJSONEventObject, JSONEventObject } from "../../store"
import { equalObject, inlineUnescape, isEmptyObject, isObject } from "../../utils"
import mojangParser from "../mojang-parser"
import PresetColor from "./color"

interface JsonToken {
    textProps: JSONTextProps
    eventProps: JSONEventProps
}

function parseExtra(rawtext: string = '[]') {
    const obj = JSON.parse(inlineUnescape(rawtext))
    const result: JSONProps[] = []

    if (Array.isArray(obj)) {
        result.push(...obj.filter(Boolean).map(item => {
            if (typeof item === 'string') {
                return { text: item }
            }
            return item
        }))
        return result
    }

    const { extra, ...restProps } = obj

    const keys = Object.keys(restProps)
    if (!(keys.length === 0 || keys.length === 1 && keys[0] === 'text')) {
        result.push(restProps)
    }
    if (extra) {
        result.push(...extra)
    }
    return result
}

function addLR(props: JSONProps[]) {
    if (!! props.length) {
        const last = props[props.length - 1]
        last.text += '\\n'
    } else {
        props.push({
            text: '\\n'
        })
    }
}

function createJsonToken(props: JSONProps | string): {
    textProps: JSONTextProps
    eventProps: JSONEventProps
} {
    if (typeof props === 'string') {
        return {
            textProps: {
                text: props
            },
            eventProps: {},
        }
    }
    const { text, color, bold, italic, obfuscated, strikethrough, underlined, ...eventProps } = props

    const colorItem = PresetColor.find(item => item.id === color)

    return {
        textProps: {
            text, bold, italic, obfuscated, strikethrough,
            color: colorItem ? colorItem.fc : color,
        },
        eventProps,
    }
}

export function parseJText(rawnbt: string) {
    return new Promise<JsonToken[][]>((resolve, reject) => {
        try {
            let arr = JSON.parse(rawnbt) as JSONProps[] | JSONProps
            if (! isObject(arr)) {
                reject()
                return
            }

            if (! Array.isArray(arr)) {
                arr = [arr]
            }

            const tokens = arr.filter(Boolean).map(item => {
                return createJsonToken(item)
            })
            resolve([tokens])
        } catch {
            try {
                const obj = mojangParser(rawnbt)

                // book
                const pages = (obj?.pages || obj?.Item?.tag?.pages) as string[]
                if (pages) {
                    const tokens = pages.map((page) => {
                        const arr = page.startsWith('{')
                            ? parseExtra(page)
                            : (JSON.parse(inlineUnescape(page)) as JSONProps[])
                        return arr.filter(Boolean).map(item => createJsonToken(item))
                    })
                    resolve(tokens)
                    return
                }

                // sign
                if ('Text1' in obj ||
                    'Text2' in obj ||
                    'Text3' in obj ||
                    'Text4' in obj
                    ) {
                    const text1 = parseExtra(obj.Text1)
                    addLR(text1)
                    const text2 = parseExtra(obj.Text2)
                    addLR(text2)
                    const text3 = parseExtra(obj.Text3)
                    addLR(text3)
                    const text4 = parseExtra(obj.Text4)
                    addLR(text4)

                    const allText = [...text1, ...text2, ...text3, ...text4]
                    const tokens = allText.map(item => createJsonToken(item))
                    resolve([tokens])
                }
            } catch (error) {
                reject(error)
            }
        }
    })
}

function deserializedTextNode(props: JSONTextProps) {
    const node = $createTextNode(props.text)
    props.bold && node.toggleFormat('bold')
    props.italic && node.toggleFormat('italic')
    props.strikethrough && node.toggleFormat('strikethrough')
    props.underlined && node.toggleFormat('underline')
    props.obfuscated && node.toggleFormat('subscript')
    props.color && node.setStyle(`color:${props.color}`)
    return node
}

function createEventObject(props: JSONEventProps) {
    const eventObject = createJSONEventObject()
    // 更新通用属性
    if (!! props.clickEvent?.value) {
        eventObject.clickEvent = props.clickEvent
        eventObject.clickEvent.action = props.clickEvent.action || 'run_command'
    }
    if (!! props.hoverEvent?.value) {
        eventObject.hoverEvent = props.hoverEvent
        eventObject.hoverEvent.action = props.hoverEvent.action || 'show_text'
    }
    if (!! props.insertion) {
        eventObject.insertion = props.insertion
    }
    if (!! props.font) {
        eventObject.font = props.font
    }
    // 更新可选属性
    if (!! props.nbt) {
        const nbt = eventObject.nbt
        if (!! props.block) {
            nbt.type = 'block'
            nbt.value = props.block
        } else if (!! props.entity) {
            nbt.type = 'entity'
            nbt.value = props.entity
        } else {
            nbt.type = 'storage'
            nbt.value = props.storage || ''
        }
        if (!! props.interpret) {
            nbt.interpret = props.interpret
        }
        if (!! props.separator) {
            nbt.separator = props.separator
        }
    } else if (!! props.selector) {
        eventObject.type = 'selector'
    } else if (!! props.score) {
        eventObject.type = 'score'
        eventObject.score = props.score
    } else if (!! props.translate) {
        eventObject.type = 'translate'
        eventObject.translate = {
            translate: props.translate,
            with: props.with || '',
        }
    } else if (!! props.keybind) {
        eventObject.type = 'keybind'
        eventObject.keybind = props.keybind
    }
    return eventObject
}

export function deserialized(tokenList: JsonToken[][]): {
    nodes: Array<ParagraphNode | HorizontalRuleNode>
    eventList: JSONEventObject[]
    nodeMap: Map<string, NodeKey>
} {
    const nodes: Array<ParagraphNode | HorizontalRuleNode> = []
    const eventList: JSONEventObject[] = []
    const nodeMap = new Map<string, NodeKey>()
    let paragraph = $createParagraphNode()
    let prevEventProps: JSONEventProps | null = null

    tokenList.forEach(tokens => {
        tokens.forEach(({ textProps, eventProps }) => {
            let markNode: MarkNode | null = null
            // 处理mark节点
            if (!isEmptyObject(prevEventProps) && equalObject(prevEventProps, eventProps)) {
                // 获取上一个节点的markNode
                const lastNode = nodes[nodes.length - 1]
                if ($isParagraphNode(lastNode)) {
                    const lastChildNode = lastNode.getLastChild()
                    if ($isMarkNode(lastChildNode)) {
                        markNode = lastChildNode
                    }
                }
            } else if (! isEmptyObject(eventProps)) {
                markNode = $createMarkNode([])
                const eventObject = createEventObject(eventProps)
                eventList.push(eventObject)
                markNode.addID(eventObject.id)
                nodeMap.set(eventObject.id, markNode.getKey())
            }
            // 更新
            prevEventProps = eventProps
            
            // 处理text节点
            const textArr = textProps.text ? textProps.text.split('\n') : [`〔〕`]
            const [textNode, ...restList] = textArr.map((text: string) => {
                return deserializedTextNode({
                    ...textProps,
                    text,
                })
            })
    
            if (markNode) {
                markNode.append(textNode)
                paragraph.append(markNode)
            } else {
                paragraph.append(textNode)
            }
    
            restList.forEach(node => {
                nodes.push(paragraph)
                prevEventProps = null
                paragraph = $createParagraphNode()
                if (node.getTextContentSize()) {
                    paragraph.append(node)
                }
            })
        })
        nodes.push(paragraph)
        nodes.push($createHorizontalRuleNode())
        paragraph = $createParagraphNode()
    })

    nodes.pop()

    return {
        nodes,
        eventList,
        nodeMap,
    }
}