import { useEffect } from "react"
import styled from "styled-components"
import { Editor } from "./components/editor"
import useOnce from "./hooks/useOnce"
import { AppContext, useAppReducer } from "./store"

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

    // 卸载前保存数据
    useEffect(() => {
        function handle(e: any) {
            localStorage.setItem('__jte__', JSON.stringify(state))
            e.returnValue = 'delay'
        }
        window.addEventListener('beforeunload', handle)
        return () => {
            window.removeEventListener('beforeunload', handle)
        }
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
