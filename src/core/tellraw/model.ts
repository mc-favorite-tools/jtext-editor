/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
export interface ScoreToken {
    name: string,
    objective: string,
}

export type HoverTokenType = 
    | 'show_text'
    | 'show_item'
    | 'show_entity'

export interface HoverToken {
    action: HoverTokenType,
    value: string,
}

export interface ClickToken {
    action: ClickActionType
    value: string
}

export type ClickActionType = 
    | 'open_url'
    | 'change_page'
    | 'run_command'
    | 'suggest_command'
    | 'copy_to_clipboard'

export type NbtType = 'block' | 'entity' | 'storage'

export interface NbtToken {
    type: NbtType
    value: string
    path: string
    interpret: boolean
    separator: string
}

export interface TranslateToken {
    translate: string
    with: string
}