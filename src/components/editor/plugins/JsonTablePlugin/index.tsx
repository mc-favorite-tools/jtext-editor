import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Input, message, Select, Table } from "antd";
import { ColumnType } from "antd/lib/table";
import clsx from "clsx";
import { SerializedEditorState } from "lexical";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toJSONText, toStringify } from "../../../../core/tellraw";
import { AppContext, defaultTplMap } from "../../../../store";
import { copy } from "../../../../utils";

const Wrapper = styled.div`
    a.disabled {
        cursor: not-allowed;
        color: #ccc;
    }
`


const defalutTplType = 'tellraw'

export default function JsonTablePlugin() {
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedRowItems, setSelectedRowItems] = useState<{
        data: SerializedEditorState
        id: string
        time: string
    }[]>([])
    const [state, dispatch] = useContext(AppContext)
    const [editor] = useLexicalComposerContext()

    const format = useCallback((data: SerializedEditorState) => toStringify(toJSONText(data, state.eventList)), [state.eventList])

    const columns: ColumnType<{
        data: SerializedEditorState
        id: string
        time: string
    }>[] = [
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
            width: 200,
            render: (_, __, index) => {
                return (
                    <div>
                        <a style={{ marginRight: 8 }} title='仅生成nbt' onClick={() => {
                            copy(`["",${format(_.data)}]`)
                            message.success('已复制到剪贴版')
                        }}>生成</a>
                        <a className={clsx({ disabled: index === 0})} style={{ marginRight: 8 }} title='上移当前项' onClick={() => {
                            dispatch({
                                type: 'MoveJsonItem',
                                index,
                                offset: -1,
                            })
                        }}>上移</a>
                        <a className={clsx({ disabled: index === state.jsonList.length - 1 })} style={{ marginRight: 8 }} title='下移当前项' onClick={() => {
                            dispatch({
                                type: 'MoveJsonItem',
                                index,
                                offset: 1,
                            })
                        }}>下移</a>
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

    useEffect(() => {
        setSelectedRowKeys(keys => {
            setSelectedRowItems(state.jsonList.filter(item => keys.includes(item.id)))
            return keys
        })
    }, [state.jsonList])

    const toTellraw = () => {
        if (selectedRowKeys.length) {
            const result = selectedRowItems.map(item => format(item.data)).join(',')
            copy(tpl.replace('%s', result))
            message.success('已复制到剪切板')
            return;
        }
        message.warning('请至少选择一项')
    }
    const toSign = () => {
        if (selectedRowKeys.length > 0 && selectedRowKeys.length <= 4) {
            const result = selectedRowItems.map((item, index) => `Text${index + 1}:'[${format(item.data)}]'`).join(',')
            if (result.includes('\\n')) {
                message.warning('已复制到剪切板(木牌无法显示换行符)')
            } else {
                message.success('已复制到剪切板')
            }
            copy(tpl.replace('%s', result))
            return;
        }
        message.warning('请选择1-4项')
    }
    const toBook = () => {
        if (selectedRowKeys.length) {
            const result = selectedRowItems.map(item => `'[${format(item.data)}]'`).join(',')
            copy(tpl.replace('%s', result))
            message.success('已复制到剪切板')
            return;
        }
        message.warning('请至少选择一项')
    }
    const toTitle = () => {
        if (selectedRowKeys.length) {
            const result = selectedRowItems.map(item => format(item.data)).join(',')
            copy(tpl.replace('%s', result))
            message.success('已复制到剪切板')
            return;
        }
        message.warning('请至少选择一项')
    }
    const onChange = (select: any, items: any) => {
        setSelectedRowKeys(select)
        setSelectedRowItems(items)
    }

    const create = useCallback(() => {
        switch (state.tplType) {
            case 'tellraw':
                return toTellraw()
            case 'sign':
                return toSign()
            case 'book':
                return toBook()
            case 'title':
                return toTitle()
            default:
                return;
        }
    }, [state.tplType])

    return (
        <Wrapper>
            <div style={{ marginBottom: 16 }}>
                <Input
                    addonBefore={
                        <Select defaultValue={defalutTplType} onChange={(tplType) => {
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
                    addonAfter={
                        <a onClick={create}>生成</a>
                    }
                    value={tpl}
                    onChange={(e) => {
                        e.persist()
                        const value = e.target.value
                        const tplMap = { ... state.tplMap }
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
                rowSelection={{
                    selectedRowKeys,
                    onChange
                }}
                pagination={false}
                dataSource={state.jsonList}
                columns={columns}/>
        </Wrapper>
    )
}