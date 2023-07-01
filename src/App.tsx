/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import { useEffect } from "react"
import styled from "styled-components"
import { Editor } from "./components/editor"
import { cacheEventMap, nodeKeyMap } from "./components/editor/plugins/CommentPlugin"
import { AppContext, useAppReducer } from "./store"
import { bindEvent, toObject } from "./utils"
import * as idbKeyval from 'idb-keyval'
import 'antd/dist/antd.min.css'

const H1 = styled.h1`
    margin-top: 16px;
    text-align: center;
    user-select: none;
    > span {
        font-size: 0;
    }
    > img {
        height: 36px;
    }
`

const Footer = styled.footer`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    position: fixed;
    font-size: 12px;
    bottom: 0;
    > a {
        margin-right: 8px;
    }
`

function App() {
    const [state, dispatch] = useAppReducer()

    useEffect(() => {
        try {
            idbKeyval.get('__jte_nodeKeyMap__').then(nodeKeyMapObj => {
                Object.keys(nodeKeyMapObj || {}).forEach(k => {
                    nodeKeyMap.set(k, nodeKeyMapObj[k])
                })
            })
            idbKeyval.get('__jte_cacheEventMap__').then(cacheEventMapObj => {
                Object.keys(cacheEventMapObj || {}).forEach(k => {
                    cacheEventMap.set(k, cacheEventMapObj[k])
                })
            })
        } catch (error) {}
    }, [])

    // 卸载前保存数据
    useEffect(() => {
        return bindEvent('beforeunload', (e: any) => {
            idbKeyval.set('__jte__', state),
            idbKeyval.set('__jte_nodeKeyMap__', toObject(nodeKeyMap)),
            idbKeyval.set('__jte_cacheEventMap__', toObject(cacheEventMap))
            e.returnValue = 'delay'
        })
    }, [state])

    return (
        <AppContext.Provider value={[state, dispatch]}>
            <H1>
                <span>JText Editor</span>
                <img src="./logo.svg" alt="" style={{ marginRight: 16 }} />
                <img src="./logo-text.svg" alt="" />
            </H1>
            <Editor />
            <Footer>
                <span style={{ margin: 4 }}>Copyright © {new Date().getFullYear()} by </span>
                <a style={{ textDecoration: 'none' }} href="https://github.com/hans000/mc-advancement-viewer" target="_blank"> hans000</a>
                <span>QQ: 2112717288</span>
                <a style={{ margin: 4 }} target={'_blank'} href="https://github.com/mc-favorite-tools/jtext-editor/issues">问题反馈</a>
            </Footer>
        </AppContext.Provider>
    )
}

export default App
