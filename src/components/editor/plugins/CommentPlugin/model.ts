import { createUID } from "../../../../utils"

export type Thread = {
    id: string
    type: 'thread'
}


export function createThread(id = createUID()): Thread {
    return {
        id,
        type: 'thread',
    }
}