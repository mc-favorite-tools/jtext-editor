import { $createRangeSelection, $getRoot, $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, $setSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, createCommand, FORMAT_TEXT_COMMAND,  LexicalCommand, NodeKey, ParagraphNode, REDO_COMMAND, SELECTION_CHANGE_COMMAND, SerializedLexicalNode, TextNode, UNDO_COMMAND } from 'lexical';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from '@lexical/selection';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined, QuestionCircleOutlined, BgColorsOutlined, FunctionOutlined, UserOutlined, CopyOutlined, UploadOutlined, ClearOutlined, UndoOutlined, RedoOutlined, SaveOutlined, PlusOutlined, FontSizeOutlined, SettingOutlined, ReloadOutlined, LineOutlined, ImportOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { $getNearestBlockElementAncestorOrThrow, mergeRegister } from '@lexical/utils';
import ColorPicker from '../../color-picker';
import { cacheEventMap, INSERT_INLINE_COMMAND, nodeKeyMap } from './CommentPlugin';
import { AppContext, defaultTplMap } from '../../../store';
import { bindEvent, copy, createTime, createUID, escape } from '../../../utils';
import { $isMarkNode, $unwrapMarkNode } from '@lexical/mark';
import { Dropdown, Input, InputRef, Menu, message, Modal, Select } from 'antd';
import { toStringify, transform } from '../../../core/tellraw';
import useOnce from '../../../hooks/useOnce';
import * as idbKeyval from 'idb-keyval'
import { $isHorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { deserialized, parseJText } from '../../../core/tellraw/parse';

const Wrapper = styled.div`
    margin-bottom: 8px;

    .text-btn {
        display: inline-block;
        font-size: 20px;
        > em {
            &::after {
                content: '|';
                display: inline-block;
                vertical-align: 1px;
                color: #ddd;
            }
        }
       .text-btn-item {
            font-size: 20px;
            padding: 4px;
            margin-right: 2px;
            border-radius: 4px;
            outline: none;
            &.disabled {
                color: #aaa;
                cursor: not-allowed;
            }
            &.active {
                background-color: #efefef;
            }
            &:hover {
                background-color: #eee;
            }
        }
    }
`

export default function ToolbarPlugin(props: {
    visible: boolean
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [editor] = useLexicalComposerContext()
    const [activeEditor, setActiveEditor] = useState(editor)
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrikethrough, setIsStrikethrough] = useState(false)
    const [isObfuscated, setIsObfuscated] = useState(false)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)
    const [state, dispatch] = useContext(AppContext)
    const [fontColor, setFontColor] = useState('#000')
    const [text, setText] = useState('')
    const [hasSelectedMarkOrParagraphNode, setHasSelectedMarkOrParagraphNode] = useState(false)
    const [isSelected, setIsSelected] = useState(false)
    const importTextRef = useRef<InputRef>(null)
    
    const updateToolbar = useCallback(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsObfuscated(selection.hasFormat('subscript'));

            setFontColor($getSelectionStyleValueForProperty(selection, 'color', '#000'))
        }

    }, [activeEditor])

    useEffect(() => {
        return bindEvent('keydown', (e) => {
            if (e.ctrlKey && e.key === 'p' && !props.visible) {
                e.preventDefault()
                props.setVisible(true)
            }
        })
    })

    useEffect(() => {
        return mergeRegister(
            activeEditor.registerCommand<boolean>(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload)
                    return false
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            activeEditor.registerCommand<boolean>(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload)
                    return false
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload: any, newEditor: any) => {
                  updateToolbar()
                  setActiveEditor(newEditor)
                  return false
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
            editor.registerUpdateListener(() => {
                editor.getEditorState().read(() => {
                    // 设置文本
                    const text = $getRoot().getTextContent().trim()
                    setText(text)
                    // 检测是否选中markNode节点
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) {
                        setIsSelected(!selection.isCollapsed())

                        const nodes = selection.getNodes()
                        const has = nodes.length === 1
                            ? nodes[0].getType() === 'mark' || $isMarkNode(nodes[0].getParent())
                            : nodes.some(node => $isMarkNode(node) || $isParagraphNode(node))
                        setHasSelectedMarkOrParagraphNode(has)
                    }
                })
            })
        )
    }, [editor, updateToolbar])

    const applyStyleText = useCallback(
        (styles: Record<string, string>) => {
            activeEditor.update(() => {
                const selection = $getSelection()
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, styles)
                }
            });
        },
        [activeEditor],
    )

    const onFontColorSelect = useCallback(
        (value: string) => {
            applyStyleText({color: value})
        },
        [applyStyleText],
    )

    useOnce((done) => {
        done()
        // 加载数据
        idbKeyval.get('__jte__').then(localState => {
            if (localState) {
                // 加载本地的资源
                dispatch({
                    type: 'Load',
                    state: localState,
                })

                editor.update(() => {
                    let json
                    if (localState.currentJson) {
                        json = localState.currentJson.data
                    }
                    if (json) {
                        const editorState = editor.parseEditorState(json)
                        editor.setEditorState(editorState)
                    }
                })
            }
        })
    }, [])

    const clearFormatting = useCallback(() => {
        activeEditor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
                selection.getNodes().forEach((node) => {
                    if ($isTextNode(node)) {
                        node.setFormat(0)
                        node.setStyle('')
                        $getNearestBlockElementAncestorOrThrow(node).setFormat('')
                    }
                    if ($isMarkNode(node)) {
                        const id = node.getIDs()[0]
                        nodeKeyMap.delete(id)
                        cacheEventMap.delete(id)
                        $unwrapMarkNode(node)
                    }
                })
            }
        })
    }, [activeEditor])

    useEffect(() => {
        // 保存当前编辑器区域的数据
        const editorState = editor.getEditorState()

        editorState.read(() => {
            const data = editorState.toJSON()
            const nodeKeys: NodeKey[] = []
            const nodes = $getRoot().getChildren().filter(item => $isParagraphNode(item)).map(item => item.getChildren()).flat()
            nodes.forEach(node => {
                if ($isMarkNode(node)) {
                    nodeKeys.push(node.getIDs()[0])
                }
            })

            // 保存到临时变量中
            dispatch({
                type: 'UpdateCurrentJson',
                currentJson: (
                    {
                        id: createUID(),
                        data,
                        text,
                        nodeKeys,
                        time: createTime(),
                    }
                ),
            })
        })
    }, [state.jsonIndex, editor, text])

    const save = useCallback(() => {
        const editorState = editor.getEditorState()
        editorState.read(() => {
            const data = editorState.toJSON()
            if (state.jsonIndex !== -1) {
                const json = state.jsonList[state.jsonIndex]
                const nodeKeys: NodeKey[] = []
                const nodes = $getRoot().getChildren().filter(item => $isParagraphNode(item)).map(item => item.getChildren()).flat()
                nodes.forEach(node => {
                    if ($isMarkNode(node)) {
                        nodeKeys.push(node.getIDs()[0])
                    }
                })
                
                dispatch({
                    type: 'UpdateJson',
                    json: {
                        ...json,
                        data,
                        text,
                        nodeKeys,
                        time: createTime(),
                    },
                })
            } else {
                add(true)
            }
        })
    }, [editor, state.jsonIndex, state.jsonList, text])

    const add = useCallback((noinfo = false) => {
        const editorState = editor.getEditorState()

        editorState.read(() => {
            const data = editorState.toJSON()

            const nodeKeys: NodeKey[] = []
            const nodes = $getRoot().getChildren().filter(item => $isParagraphNode(item)).map(item => item.getChildren()).flat()
            nodes.forEach(node => {
                if ($isMarkNode(node)) {
                    nodeKeys.push(node.getIDs()[0])
                }
            })

            const promise = new Promise((resolve, reject) => {
                if (text.length) {
                    if (noinfo) {
                        resolve(true)
                    } else {
                        Modal.warning({
                            okCancel: true,
                            closable: true,
                            content: '是否保存当前工程？',
                            onOk() {
                                resolve(true)
                            },
                            onCancel(...args) {
                                if (args.length === 0) {
                                    resolve(false)
                                } else {
                                    reject()
                                }
                            },
                            okText: '保存并新建',
                            cancelText: '直接新建',
                        })
                    }
                } else {
                    resolve(false)
                }
            })
            
            promise.then((isSave) => {
                if (isSave) {
                    if (state.jsonIndex !== -1) {
                        const json = state.jsonList[state.jsonIndex]
                        dispatch({
                            type: 'UpdateJson',
                            json: {
                                ...json,
                                data,
                                nodeKeys,
                                time: createTime(),
                            },
                        })
                    } else {
                        dispatch({
                            type: 'AddJson',
                            json: {
                                id: createUID(),
                                data,
                                text,
                                nodeKeys,
                                time: createTime(),
                            }
                        })
                    }
                }
                
                dispatch({
                    type: 'UpdateJsonIndex',
                    index: -1,
                })

                editor.update(() => {
                    $getRoot().clear()
                })
            })
            
        })
        
    }, [editor, state.jsonIndex, state.jsonList, text])
    
    const activeJson = useMemo(
        () => {
            if (state.jsonIndex > -1) {
                return state.jsonList[state.jsonIndex]
            }
            return state.currentJson
        },
        [state.currentJson, state.jsonIndex, state.jsonList]
    )
    
    const eventList = useMemo(
        () => {
            if (activeJson) {
                return activeJson.nodeKeys.map(nodeKey => {
                    return cacheEventMap.get(nodeKey)!
                })
            }
            return []
        },
        [activeJson, state.trigger]
    )

    const create = (type: string) => {
        activeEditor.update(() => {
            let selection = $getSelection()
            if ($isRangeSelection(selection)) {
                let offset = 1

                if (selection.isBackward()) {
                    const focus = selection.focus;
                    const anchor = selection.anchor;
                    const newSelection = $createRangeSelection()
                    newSelection.anchor.set(focus.key, focus.offset, anchor.type)
                    newSelection.focus.set(anchor.key, anchor.offset, anchor.type)
                    $setSelection(newSelection)
                    selection = newSelection
                }

                const nodes = selection.extract()
                console.log(nodes)
                const result: SerializedLexicalNode[][] = []
                let tmpSerializedNode: SerializedLexicalNode[] = []

                let isFirstParagraphNode = true

                for (let i = 0; i < nodes.length; i+=offset) {
                    const node = nodes[i];
                    if ($isTextNode(node)) {
                        tmpSerializedNode.push(node.exportJSON())
                        offset = 1
                        continue
                    }
                    if ($isMarkNode(node)) {
                        const children = node.getChildren()
                        const serializedMarkNode = node.exportJSON()
                        serializedMarkNode.children = children.map(node => node.exportJSON())
                        tmpSerializedNode.push(serializedMarkNode)
                        
                        offset = children.length + 1
                        continue
                    }
                    if ($isParagraphNode(node)) {
                        offset = 1
                        if (isFirstParagraphNode) {
                            isFirstParagraphNode = false
                            continue
                        }
                        if (/tellraw|nbt|title|book/.test(type)) {
                            const node = tmpSerializedNode[tmpSerializedNode.length - 1] as any
                            if (node) {
                                if (node.type === 'text') {
                                    node.text += '\n'
                                } else if (node.type === 'mark') {
                                    node.children[node.children.length - 1].text += '\n'
                                }
                            }
                        } else {
                            result.push(tmpSerializedNode)
                            tmpSerializedNode = []
                        }
                    }
                    if (type === 'book' && $isHorizontalRuleNode(node)) {
                        result.push(tmpSerializedNode)
                        tmpSerializedNode = []
                    }
                }
                result.push(tmpSerializedNode)

                let str = ''
                if (type === 'tellraw') {
                    const text = toStringify(transform(result[0], eventList))
                    str = state.tplMap.tellraw.replace('%s', text)
                } else if (type === 'title') {
                    const text = toStringify(transform(result[0], eventList))
                    str = state.tplMap.title.replace('%s', text)
                } else if (type === 'sign') {
                    if (result.length > 4) {
                        message.warning('sign 最多支持四行文本！')
                        return
                    }
                    const text = result.map((item, index) => `Text${index + 1}:'[${toStringify(transform(item, eventList))}]'`).join(',')
                    str = state.tplMap.sign.replace('%s', text)
                } else if (type === 'book') {
                    const text = result.map(item => {
                        const props = transform(item, eventList)
                        return `'[${toStringify(props, true).replace(/\\"/g, '"').replace(/\\n/g, '\\\\n')}]'`
                    }).join(',')
                    str = state.tplMap.book.replace('%s', text)
                } else {
                    str = '["",' + toStringify(transform(result[0], eventList)) + ']'
                }
                copy(str)
                message.success('已复制到剪贴版')
            }
        })
    }

    return (
        <Wrapper>
            <div className="text-btn">
                <UndoOutlined title='撤销(ctrl+z)' className={clsx('text-btn-item', { disabled: !canUndo })} onClick={() => {
                    if (canUndo) {
                        activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
                    }
                }} />
                <RedoOutlined title='反撤销(ctrl+y)' className={clsx('text-btn-item', { disabled: !canRedo })} onClick={() => {
                    if (canRedo) {
                        activeEditor.dispatchCommand(REDO_COMMAND, undefined);
                    }
                }} />
                <em></em>
                <BoldOutlined title='加粗(ctrl+b)' className={clsx('text-btn-item', { active: isBold })} onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
                }} />
                <ItalicOutlined title='斜体(ctrl+i)' className={clsx('text-btn-item', { active: isItalic })} onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
                }} />
                <UnderlineOutlined title='下划线(ctrl+u)' className={clsx('text-btn-item', { active: isUnderline })} onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
                }}/>
                <StrikethroughOutlined title='删除线' className={clsx('text-btn-item', { active: isStrikethrough })} onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
                }} />
                <QuestionCircleOutlined title='混淆' className={clsx('text-btn-item', { active: isObfuscated })} onClick={() => {
                    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
                }} />
                <ColorPicker color={fontColor} onChange={onFontColorSelect}>
                    <BgColorsOutlined title='修改颜色' className='text-btn-item' />
                </ColorPicker>
                <ClearOutlined title='清除格式' className='text-btn-item' onClick={clearFormatting}/>
                <FunctionOutlined title='添加功能' className={clsx('text-btn-item', { disabled: hasSelectedMarkOrParagraphNode })} onClick={() => {
                    editor.dispatchCommand(INSERT_INLINE_COMMAND, null)
                }} />
                <LineOutlined title='分隔符' className='text-btn-item' onClick={() => {
                    activeEditor.dispatchCommand(
                        INSERT_HORIZONTAL_RULE_COMMAND,
                        undefined,
                    );
                }} />

                <em></em>

                <PlusOutlined title='新建' className={clsx('text-btn-item', { disabled: !text })} onClick={() => {
                    if (!!text) {
                        add()
                    }
                }}/>
                <SaveOutlined disabled={!text} title='暂存' className={clsx('text-btn-item', { disabled: !text })} onClick={() => {
                    if (!!text) {
                        save()
                    }
                }}/>
                <Dropdown disabled={!isSelected} overlay={<Menu onClick={(e) => {
                    create(e.key)
                }} items={[
                    { label: '仅nbt', key: 'nbt', },
                    { label: 'tellraw', key: 'tellraw', },
                    { label: 'title', key: 'title', },
                    { label: 'sign', key: 'sign', },
                    { label: 'book', key: 'book', },
                ]}/>}>
                    <CopyOutlined title='对选取内生成nbt' className={clsx('text-btn-item', { disabled: !isSelected })} />
                </Dropdown>
                <ColorPicker color={state.bgColor} onChange={(bgColor) => {
                    dispatch({
                        type: 'UpdateBgColor',
                        bgColor,
                    })
                }}>
                    <BgColorsOutlined title='修改背景颜色' className='text-btn-item' />
                </ColorPicker>
                <ReloadOutlined title='重置配置' className='text-btn-item' onClick={() => {
                    Modal.warning({
                        title: '该操作会重置所有用户信息，确定吗？',
                        onOk() {
                            idbKeyval.del('__jte__')
                            idbKeyval.del('__jte_cacheEventMap__')
                            idbKeyval.del('__jte_nodeKeyMap__')
                            nodeKeyMap.clear()
                            cacheEventMap.clear()
                            dispatch({
                                type: 'Reset',
                            })
                            editor.update(() => {
                                $getRoot().clear()
                            })
                        },
                        okCancel: true,
                        okText: '确定',
                        cancelText: '取消'
                    })
                }}/>
                <ImportOutlined title='导入命令' className='text-btn-item' onClick={() => {
                    Modal.info({
                        title: '导入nbt命令',
                        content: (
                            <Input ref={importTextRef} placeholder='必填，仅nbt' autoFocus allowClear />
                        ),
                        closable: true,
                        onOk() {
                            const rawtext = importTextRef.current!.input!.value.trim()
                            if (! rawtext.length) {
                                message.warning('请输入要导入的文本！')
                                return true
                            }
                            parseJText(rawtext)
                                .then((tokens) => {
                                    editor.update(() => {
                                        const { nodes, eventList, nodeMap } = deserialized(tokens)
                                        const root = $getRoot()
                                        root.clear()
                                        nodeMap.forEach((value, id) => {
                                            nodeKeyMap.set(id, value)
                                        })
                                        nodes.forEach(node => {
                                            root.append(node)
                                        })
                                        eventList.forEach(item => {
                                            cacheEventMap.set(item.id, item)
                                        })
                                    })
                                }).catch(() => {
                                    message.warning('导入文本格式有误！')
                                    return true
                                })
                        },
                        okText: '确定'
                    })
                }} />
                <SettingOutlined title='管理(ctrl+p)' className='text-btn-item' onClick={() => {
                    props.setVisible(true)
                }} />
                {/* <FontSizeOutlined title='切换字体' className='text-btn-item' onClick={() => {
                   
                }} /> */}
                {/* <Upload style={{ fontSize: 20 }} maxCount={1}
                    accept={'image/png, image/jpeg, image/jpg'}
                    action={'/'}
                    showUploadList={false}

                    beforeUpload={(file) => {
                        
                        return false
                    }} >
                    <UploadOutlined title='上传背景图' className='text-btn-item' />
                </Upload> */}

            </div>
        </Wrapper>
    )
}