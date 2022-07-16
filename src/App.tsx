import { useEffect } from "react"
import styled from "styled-components"
import { Editor } from "./components/editor"
import { cacheEventMap, nodeKeyMap } from "./components/editor/plugins/CommentPlugin"
import { AppContext, useAppReducer } from "./store"
import { bindEvent, toObject } from "./utils"
import * as idbKeyval from 'idb-keyval'

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
                <a target={'_blank'} href="https://github.com/hans000/jtext-editor/issues">问题反馈</a>
                <a target={'_blank'} title="916625813" href="https://jq.qq.com/?_wv=1027&k=onvGmdy5">加入群聊</a>
                <img src="https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg" />
                <span>by hans0000</span>
            </Footer>
        </AppContext.Provider>
    )
}

export default App
