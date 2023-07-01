/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import { useEffect, useRef } from "react"

export default function useOnce(effect: (done: Function) => any, deps?: React.DependencyList | undefined) {
    const initRef = useRef(true)

    const done = () => initRef.current = false

    useEffect(() => {
        if (initRef.current) {
            return effect(done)
        }
    }, deps)
}