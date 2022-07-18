import { SerializedMarkNode } from '@lexical/mark/MarkNode';
import { SerializedLexicalNode, SerializedTextNode } from 'lexical';
import { SerializedEditorState } from 'lexical';
import { JSONEventObject } from '../../store';
import { clone, escape, isObject } from '../../utils';
import PresetColor from './color';
import { ClickToken, HoverToken, ScoreToken, TranslateToken } from './model';

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_OBFUSCATED = 1 << 5

function pickColor(text: string) {
    const match = text.match(/color:\s*(.*);?\b/)
    if (match) {
        const [, color] = match
        const colorItem = PresetColor.find(item => item.fc === color)
        if (colorItem) {
            return colorItem.id
        }
        return color
    }
    return ''
}

export interface JSONTextProps {
    text: string
    bold?: boolean
    italic?: boolean
    strikethrough?: boolean
    underlined?: boolean
    obfuscated?: boolean
    color?: string,
}

export interface JSONEventProps {
    clickEvent?: ClickToken
    hoverEvent?: HoverToken
    nbt?: string
    entity?: string
    block?: string
    storage?: string
    selector?: string
    insertion?: string
    font?: string
    keybind?: string
    interpret?: boolean
    separator?: string
    translate?: string
    with?: string
    score?: {
        name: string
        objective: string
    }
}

export type JSONProps = Spread<JSONTextProps, JSONEventProps>

function getStyle(node: SerializedTextNode): JSONTextProps {
    const bold = !!(node.format & IS_BOLD)
    const italic = !!(node.format & IS_ITALIC)
    const strikethrough = !!(node.format & IS_STRIKETHROUGH)
    const underline = !!(node.format & IS_UNDERLINE)
    const obfuscated = !!(node.format & IS_OBFUSCATED)
    const color = pickColor(node.style)
    const text = node.text

    return {
        ...(bold && { bold }),
        ...(italic && { italic }),
        ...(strikethrough && { strikethrough }),
        ...(underline && { underlined: underline }),
        ...(obfuscated && { obfuscated }),
        ...(color && { color }),
        text,
    }
}

function toJSONEventProps(comment: JSONEventObject) {
    const result: JSONEventProps = {}
    if (!! comment.clickEvent.value) {
        result.clickEvent = comment.clickEvent
    }
    if (!! comment.hoverEvent.value) {
        result.hoverEvent = comment.hoverEvent
    }
    if (!! comment.insertion) {
        result.insertion = comment.insertion
    }
    if (!! comment.font) {
        result.font = comment.font
    }

    if (comment.type === 'nbt') {
        const { type, path, value, interpret, separator } = comment.nbt
        if (!! value) {
            result.nbt = path
            result[type] = value
            if (interpret) {
                result.interpret = interpret
            }
            if (separator) {
                result.separator = separator
            }
        }
    } else if (comment.type === 'score') {
        const { objective, name } = comment.score
        if (!! name) {
            result.score = {
                name,
                objective
            }
        }
    } else if (comment.type === 'selector') {
        if (comment.selector) {
            result.selector = comment.selector
        }
    } else if (comment.type === 'keybind') {
        if (comment.keybind) {
            result.keybind = comment.keybind
        }
    } else if (comment.type === 'translate') {
        if (comment.translate) {
            result.translate = comment.translate.translate
            result.with = comment.translate.with
        }
    }

    return result
}

export function transform(nodes: SerializedLexicalNode[], configList: JSONEventObject[]) {
    const result: JSONProps[] = []
    for (const node of nodes) {
        if (node.type === 'mark') {
            const [id] = (node as SerializedMarkNode).ids
            const styles = transform((node as SerializedMarkNode).children, configList) as JSONTextProps[]
            const config = configList.find(item => item.id === id)!
            const eventProps = toJSONEventProps(config)
            styles.forEach(style => {
                const mergeStyle = {
                    ...style,
                    ...eventProps
                }
                result.push(mergeStyle)
            })
        } else {
            const style = getStyle(node as any as SerializedTextNode)
            result.push(style)
        }
        
    }
    return result
}

export function toJSONText(node: SerializedEditorState, configList: JSONEventObject[]) {
    const list = node.root.children
    const children: SerializedLexicalNode[] = []
    for (let i = 0; i < list.length; i++) {
        const node = list[i]
        if (i > 0) {
            const last = children[children.length - 1] as any
            if (last.type === 'text') {
                last.text += '\n'
            } else if (last.type === 'mark') {
                last.children[last.children.length - 1].text += '\n'
            }
        }
        children.push(...clone((node as any).children))
    }
    return transform(children, configList)
}

function clickEventStringify(clickEvent: ClickToken, needEscape = false) {
    let { action, value } = clickEvent
    if (action === 'run_command' && !value.startsWith('/')) {
        value = '/' + value
    }
    return {
        clickEvent: {
            ["action"]: action,
            ["value"]: needEscape ? escape(value) : value
        }
    }
}

function removeEvent(obj: any) {
    const removeProps = (json: any) => {
        const { clickEvent, hoverEvent, insertion, ...rest } = json
        return rest
    }
    if (Array.isArray(obj)) {
        return obj.map((item: any) => {
            if (isObject(item)) {
                return removeProps(item)
            }
            return item
        })
    } else {
        return removeProps(obj)
    }
}

function hoverEventStringify(hoverEvent: HoverToken, needEscape = false) {
    const { action, value } = hoverEvent
    let json
    try {
        // try parse text
        const obj = JSON.parse(value)
        if (isObject(obj)) {
            json = removeEvent(obj)
        } else {
            throw 'cannot parse'
        }
    } catch (error) {}
    
    return {
        hoverEvent: {
            ["action"]: action,
            ["value"]: json ? json : needEscape ? escape(value) : value,
        }
    }
}

function translateStringify(translate: TranslateToken, needEscape = false) {
    let withObj = translate.with
    try {
        const obj = JSON.parse(translate.with)
        withObj = obj
    } catch (error) {}
    return {
        translate: translate.translate,
        with: withObj
    }
}

export function toStringify(jsonItems: JSONProps[], needEscape = false) {

    return jsonItems.map(item => {
        const {
            text, 
            clickEvent,
            hoverEvent,
            translate,
            with: withObj,
            ...rest
        } = item

        const props = {
            ...rest,
            text: escape(text),
            ...(translate && translateStringify({ translate, with: withObj! }, needEscape)),
            ...(clickEvent && clickEventStringify(clickEvent, needEscape)),
            ...(hoverEvent && hoverEventStringify(hoverEvent, needEscape)),
        } as any

        if (props.nbt || props.score || props.selector || props.keybind || props.translate) {
            delete props.text
        }

        return JSON.stringify(props)

    }).join(',')

}