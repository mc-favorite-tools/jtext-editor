import { NodeKey, SerializedEditorState } from "lexical"
import { createContext, useReducer } from "react"
import { ClickToken, HoverToken, ScoreToken, NbtToken, TranslateToken } from "../core/tellraw/model"
import { clone, createUID } from "../utils"

export type JSONEventObject = {
    id: string
    clickEvent: ClickToken
    hoverEvent: HoverToken
    type: 'text' | 'nbt' | 'selector' | 'score' | 'keybind' | 'translate'
    selector?: string
    score: ScoreToken
    nbt: NbtToken
    keybind?: string
    insertion?: string
    font?: string
    translate: TranslateToken
}

export function createJSONEventObject(id = createUID()): JSONEventObject {
    return {
        id,
        type: 'text',
        clickEvent: { action: 'run_command', value: '', },
        hoverEvent: { action: 'show_text', value: '', },
        score: { objective: '', name: '*', },
        nbt: { type: 'block', value: '', path: '', interpret: false, separator: '', },
        translate: { translate: '', with: '', }
    }
}

export interface JsonTile {
    id: string
    time: string
    data: SerializedEditorState
    nodeKeys: NodeKey[]
    text: string
}

export const defaultTplMap: Record<string, string> = {
    tellraw: '/tellraw @p %s',
    title: '/title @p title %s',
    sign: '/give @p oak_sign{BlockEntityTag:{%s}}',
    book: '/give @p written_book{pages:[%s],title:"",author:"made by JText Editor"}',
}


interface IState {
    jsonList: JsonTile[]
    jsonIndex: number
    currentJson: JsonTile | null
    width: number
    bgColor: string
    tplMap: Record<string, string>
    tplType: string
    trigger: string
}

const defaultState: IState = {
    jsonList: [],
    jsonIndex: -1,
    currentJson: null,
    width: 100,
    bgColor: '#fff',
    tplMap: defaultTplMap,
    tplType: 'tellraw',
    trigger: '',
}

type Action =

    | { type: 'UpdateCurrentJson', currentJson: JsonTile | null }
    | { type: 'AddNodeKey', nodeKey: NodeKey }

    | { type: 'AddJson', json: JsonTile }
    | { type: 'UpdateJson', json: JsonTile }
    | { type: 'UpdateJsonIndex', index: number }
    | { type: 'RemoveJsonByIndex', index: number }
    | { type: 'MoveJsonItem', index: number, offset: number }
    
    | { type: 'UpdateTrigger' }

    | { type: 'UpdateWidth', width: number }
    | { type: 'UpdateBgColor', bgColor: string }

    | { type: 'UpdateTplMap', tplMap: Record<string, string> }
    | { type: 'UpdateTplType', tplType: string }

    | { type: 'Load', state: IState }
    | { type: 'Reset' }

export const AppContext = createContext<[IState, (action: Action) => void]>([defaultState, () => {}])

function reducer(state: IState, action: Action) {

    const partialUpdate = (partialState: (Partial<IState> | void) | ((state: IState) => Partial<IState> | void)) => {
        let newState = typeof partialState === 'function'
            ? partialState(state)
            : partialState
        return { ...state, ...(newState || {}) }
    }

    switch (action.type) {
        case 'Reset':
            return defaultState
        case 'Load':
            return action.state
        case 'UpdateCurrentJson':
            return partialUpdate({
                currentJson: action.currentJson
            })
        case 'AddJson':
            return partialUpdate(({ jsonList }) => {
                return {
                    jsonList: [...jsonList, action.json]
                }
            })
        case 'UpdateJson':
            return partialUpdate(({ jsonList }) => {
                const newJsonList = [...jsonList]
                newJsonList[state.jsonIndex] = action.json
                return {
                    jsonList: newJsonList,
                }
            })
        case 'UpdateJsonIndex':
            return partialUpdate({
                jsonIndex: action.index
            })
        case 'UpdateTrigger':
            return partialUpdate({
                trigger: createUID()
            })
        case 'AddNodeKey':
            return partialUpdate(({ currentJson }) => {
                if (currentJson) {
                    return {
                        currentJson: {
                            ...currentJson,
                            nodeKeys: [
                                ...currentJson.nodeKeys,
                                action.nodeKey
                            ]
                        }
                    }
                }
            })
        case 'RemoveJsonByIndex':
            return partialUpdate(({ jsonList }) => {
                const newJsonList = [...jsonList]
                newJsonList.splice(action.index, 1)
                return {
                    jsonList: newJsonList
                }
            })
        case 'MoveJsonItem':
            return partialUpdate(({ jsonList }) => {
                const newJsonList = [...jsonList]
                newJsonList.splice(action.index + action.offset, 0, ...newJsonList.splice(action.index, 1))
                return {
                    jsonList: newJsonList
                }
            })
        case 'UpdateWidth':
            return partialUpdate({
                width: action.width
            })
        case 'UpdateBgColor':
            return partialUpdate({
                bgColor: action.bgColor
            })
        case 'UpdateTplMap':
            return partialUpdate({
                tplMap: action.tplMap
            })
        case 'UpdateTplType':
            return partialUpdate({
                tplType: action.tplType
            })
        default:
            return state
    }
}

export function useAppReducer(): [IState, React.Dispatch<Action>] {
    return useReducer(reducer, defaultState)
}