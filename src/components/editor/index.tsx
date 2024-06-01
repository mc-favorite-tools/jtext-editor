/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import styled from 'styled-components';
import theme from './theme';
import CommentPlugin from './plugins/CommentPlugin';
import { MarkNode } from '@lexical/mark';
import JsonTablePlugin from './plugins/JsonTablePlugin';
import ObfuscatedPlugin from './plugins/ObfuscatedPlugin';
import { Slider } from 'antd';
import { useContext, useState } from 'react';
import { AppContext } from '../../store';
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';

const Wrapper = styled.div`
    max-width: 900px;
    margin: 0 auto;
    padding: 24px;
    background-color: #fff;

    p {
        margin: 0;
    }
    .jtp__editor {
        font-family: "Minecraft", "Minecraft-AE";
        font-size: 16px;
    }
`

export function Editor() {
    const [state, dispatch] = useContext(AppContext)
    const [visible, setVisible] = useState(false)

    const initialConfig = {
        namespace: 'JTextEditor',
        theme,
        nodes: [
            MarkNode,
            HorizontalRuleNode,
        ],
        onError: (err: any) => console.error(err),
    }

    return (
        <Wrapper>
            <LexicalComposer initialConfig={initialConfig}>
                {/* top component */}
                <ToolbarPlugin visible={visible} setVisible={setVisible} />

                <RichTextPlugin
                    contentEditable={<ContentEditable className='jtp__editor'
                        style={{
                            width: state.width + '%',
                            outline: 'none',
                            minHeight: 450,
                            border: '1px solid #eee',
                            backgroundColor: state.bgColor,
                        }} />}
                    placeholder={''}
                />
                <OnChangePlugin onChange={(editorState) => {
                    editorState.read(() => {
                        
                    })
                }} />
                <CommentPlugin />
                <HistoryPlugin />
                <ObfuscatedPlugin />
                <HorizontalRulePlugin />

                {/* bottom component */}
                <Slider step={1} min={0} max={100} value={state.width}
                    // marks={{
                    //     33: 'sign',
                    //     42: 'book',
                    // }}
                    onChange={(width) => {
                        dispatch({
                            type: 'UpdateWidth',
                            width,
                        })
                    }}/>
                <JsonTablePlugin visible={visible} setVisible={setVisible} />
            </LexicalComposer>
        </Wrapper>
    );
}