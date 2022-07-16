import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Drawer, Input, Select, Table } from "antd";
import { ColumnType } from "antd/lib/table";
import { SerializedEditorState } from "lexical";
import { useCallback, useContext, useMemo } from "react";
import styled from "styled-components";
import { toJSONText, toStringify } from "../../../../core/tellraw";
import { AppContext, defaultTplMap, JsonTile } from "../../../../store";
import { cacheEventMap } from "../CommentPlugin";

const Wrapper = styled.div`
    a.disabled {
        cursor: not-allowed;
        color: #ccc;
    }
`

const defalutTplType = 'tellraw'

export default function JsonTablePlugin(props: {
    visible: boolean
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [state, dispatch] = useContext(AppContext)
    const [editor] = useLexicalComposerContext()

    const format = useCallback(
        (data: SerializedEditorState) => {
            const eventList = Array.from(cacheEventMap.values())
            return toStringify(toJSONText(data, eventList))
        },
        [state.jsonList]
    )

    const columns: ColumnType<JsonTile>[] = [
        {
            title: '序号',
            width: 50,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            key: 'id',
            dataIndex: 'id',
            title: 'ID',
            width: 120,
        },
        {
            key: 'text',
            dataIndex: 'text',
            title: '摘要',
            ellipsis: true,
            render: (text, record, index) => {
                return (
                    <a onClick={() => {
                        editor.update(() => {
                            const editorState = editor.parseEditorState(record.data)
                            editor.setEditorState(editorState)
                        })
                        dispatch({
                            type: 'UpdateJsonIndex',
                            index,
                        })
                    }}>{text}</a>
                )
            }
        },
        {
            key: 'time',
            dataIndex: 'time',
            width: 150,
            title: '更新时间'
        },
        {
            title: '操作',
            width: 70,
            render: (_, __, index) => {
                return (
                    <div>
                        <a title='删除当前项' onClick={() => {
                            dispatch({
                                type: 'RemoveJsonByIndex',
                                index,
                            })
                        }}>删除</a>
                    </div>
                )
            }
        },
    ]

    const tpl = useMemo(() => state.tplMap[state.tplType], [state.tplMap, state.tplType])

    return (
        <Wrapper>
            <Drawer placement="right" width={600} onClose={() => {
                props.setVisible(false)
            }} visible={props.visible}>
                <div style={{ marginBottom: 16 }}>
                    <Input
                        addonBefore={
                            <Select value={state.tplType} defaultValue={defalutTplType} onChange={(tplType) => {
                                dispatch({
                                    type: 'UpdateTplType',
                                    tplType,
                                })
                            }} style={{ width: 100 }}>
                                {
                                    Object.keys(defaultTplMap).map((key) => <Select.Option key={key} value={key}>{key}</Select.Option>)
                                }
                            </Select>
                        }
                        value={tpl}
                        onChange={(e) => {
                            e.persist()
                            const value = e.target.value
                            const tplMap = { ...state.tplMap }
                            tplMap[state.tplType] = value
                            dispatch({
                                type: 'UpdateTplMap',
                                tplMap
                            })
                        }}
                    ></Input>
                </div>
                <Table
                    size='small'
                    locale={{ emptyText: <div style={{ height: 100, lineHeight: '100px' }}>暂无数据</div> }}
                    rowKey='id'
                    pagination={false}
                    dataSource={state.jsonList}
                    columns={columns}/>
            </Drawer>
        </Wrapper>
    )
}