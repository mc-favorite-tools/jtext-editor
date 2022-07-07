import dayjs from "dayjs"

export function createUID() {
    return Math.random().toString(36).slice(2)
}

export function escape(raw: string) {
    return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function unescape(raw: string) {
    return raw.replace(/\\\\/g, '\\').replace(/"/g, '"')
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