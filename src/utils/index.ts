/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import dayjs from "dayjs"

export function createUID() {
    return Math.random().toString(36).slice(2)
}

export function escape(raw: string) {
    return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function unescape(raw: string) {
    return raw.replace(/\\\\/g, '\\').replace(/\\"/g, '"')
}

export function copy(text: string) {
    navigator.clipboard.writeText(text)
}

export function partialUpdate<S>(state: S, partialState: Partial<S>): S {
    return {
        ...state,
        ...partialState,
    }
}

export function createTime() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

export function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

export function isObject(obj: any) {
    return obj && typeof obj === 'object'
}

export function toMap<K extends string | number | symbol, V>(obj: any = {}) {
    const map = new Map<K, V>()
    Object.keys(obj).forEach((k: any) => {
        map.set(k, obj[k])
    })
    return map
}

export function toObject<K extends string | number | symbol, V>(map: Map<K, V>): Record<K, V> {
    const obj: any = {}
    map.forEach((v, k) => {
        obj[k] = v
    })
    return obj
}

export function bindEvent<K extends keyof WindowEventMap>(type: K, fn: (ev: WindowEventMap[K]) => any) {
    window.addEventListener(type, fn)
    return () => window.removeEventListener(type, fn)
}

export function mergeEvent(...handles: Array<() => Function>) {
    const removeEvents = handles.map(handle => handle())
    return () => removeEvents.forEach(handle => handle())
}

export function equalObject(a: any, b: any): boolean {
    if (a === b) return true
    if (a === null || b === null) return false
    let aProps = Object.getOwnPropertyNames(a)
    let bProps = Object.getOwnPropertyNames(b)

    if (aProps.length === bProps.length) {
        return aProps.every(k => {
            if (typeof a[k] === 'object') {
                return equalObject(a[k], b[k])
            }
            return a[k] === b[k]
        })
    }

    return false
}

export function isEmptyObject(obj: any) {
    return !!obj && !Object.keys(obj).length
}

export function inlineEscape(rawtext: string) {
    return rawtext.replace(/(\\.)/g, '\\$1').replace(/(')/g, '\\$1')
}
export function inlineUnescape(rawtext: string) {
    return rawtext.replace(/(\\\\.)/g, (_, $1) => $1.slice(1)).replace(/(\\')/g,  (_, $1) => $1.slice(1))
}
