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
import { useContext, useEffect } from 'react';
import { AppContext } from '../../store';
import { $getRoot } from 'lexical';

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

function onChange(editorState: any) {
    editorState.read(() => {

    })
}

export function Editor() {
    const [state, dispatch] = useContext(AppContext)

    const initialConfig = {
        namespace: 'JTextEditor',
        theme,
        nodes: [
            MarkNode,
        ],
        onError: (err: any) => console.error(err),
    }

    return (
        <Wrapper>
            <LexicalComposer initialConfig={initialConfig}>
                {/* top component */}
                <ToolbarPlugin />

                <RichTextPlugin
                    contentEditable={<ContentEditable className='jtp__editor'
                        style={{
                            width: state.width + '%',
                            outline: 'none',
                            minHeight: '250px',
                            border: '1px solid #eee',
                            backgroundColor: state.bgColor,
                        }} />}
                    placeholder={''}
                />
                <OnChangePlugin onChange={onChange} />
                <CommentPlugin />
                <HistoryPlugin />
                <ObfuscatedPlugin />

                {/* bottom component */}
                <Slider step={1} min={0} max={100} value={state.width}
                    marks={{
                        33: 'sign',
                        42: 'book',
                    }}
                    onChange={(width) => {
                        dispatch({
                            type: 'UpdateWidth',
                            width,
                        })
                    }}/>
                <JsonTablePlugin />
            </LexicalComposer>
        </Wrapper>
    );
}