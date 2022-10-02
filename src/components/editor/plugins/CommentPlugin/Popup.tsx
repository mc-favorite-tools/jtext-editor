import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { Row, Col, Input, Radio, Select, Tooltip, Button, Divider, Checkbox } from "antd";
import { NodeKey, LexicalEditor, $getSelection, $isRangeSelection, $getNodeByKey, COMMAND_PRIORITY_CRITICAL, UNDO_COMMAND, REDO_COMMAND } from "lexical";
import { useRef, useCallback, useEffect, useContext, useMemo, useState } from "react";
import styled from "styled-components";
import { cacheEventMap } from ".";
import { KeybindList } from "../../../../core/tellraw/keybind";
import { NbtType, ClickActionType, HoverTokenType } from "../../../../core/tellraw/model";
import { AppContext, JSONEventObject } from "../../../../store";
import { bindEvent, createUID, partialUpdate } from "../../../../utils";

function TypeComponent(props: {
    value: JSONEventObject
    onChange: (value: Partial<JSONEventObject>) => void
}) {
    if (props.value.type === 'nbt') {
        return (
            <div>
                <div style={{ marginBottom: 10 }}>
                    <Input
                        spellCheck={false} allowClear
                        placeholder='必填项，请输入'
                        value={props.value.nbt.value}
                        onChange={(e) => {
                            const value = e.target.value
                            props.onChange({
                                nbt: {
                                    ...props.value.nbt,
                                    value,
                                }
                            })
                        }}
                        addonBefore={
                        <Select defaultValue='entity' value={props.value.nbt.type} onChange={(type: NbtType) => {
                            props.onChange({
                                nbt: {
                                    ...props.value.nbt,
                                    type,
                                }
                            })
                        }} style={{ width: 100 }}>
                            <Select.Option value='block'>block</Select.Option>
                            <Select.Option value='entity'>entity</Select.Option>
                            <Select.Option value='storage'>storage</Select.Option>
                        </Select> } />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <Input
                        allowClear
                        value={props.value.nbt.path}
                        spellCheck={false}
                        onChange={(e) => {
                            const path = e.target.value
                            props.onChange({
                                nbt: {
                                    ...props.value.nbt,
                                    path,
                                }
                            })
                        }}
                        addonBefore={<div style={{ width: 78, textAlign: 'center' }}>nbt</div>}
                        placeholder='必填项，nbt path' />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <Input
                        allowClear
                        value={props.value.nbt.separator}
                        spellCheck={false}
                        onChange={(e) => {
                            const separator = e.target.value
                            props.onChange({
                                nbt: {
                                    ...props.value.nbt,
                                    separator,
                                }
                            })
                        }}
                        addonBefore={<div style={{ width: 78, textAlign: 'left' }}>separator</div>}
                        placeholder='选填' />
                </div>
                <div>
                    <Checkbox checked={props.value.nbt.interpret} onChange={(e) => {
                        const interpret = e.target.checked
                        props.onChange({
                            nbt: {
                                ...props.value.nbt,
                                interpret,
                            }
                        })
                    }}>interpret</Checkbox>
                </div>
            </div>
        )
    } else if (props.value.type === 'score') {
        return (
            <div>
                <div style={{ marginBottom: 10 }}>
                    <Input spellCheck={false} placeholder='必填项，请输入' allowClear
                        addonBefore={<div style={{ width: 78, textAlign: 'left' }}>name</div>}
                        value={props.value.score.name} onChange={(e) => {
                            const name = e.target.value
                            props.onChange({
                                score: {
                                    ...props.value.score,
                                    name,
                                }
                            })
                        }} />
                </div>
                <div>
                    <Input
                        key='score'
                        spellCheck={false}
                        allowClear
                        placeholder='必填'
                        value={props.value.score.objective}
                        onChange={(e) => {
                            const objective = e.target.value
                            props.onChange({
                                score: {
                                    ...props.value.score,
                                    objective,
                                }
                            })
                        }}
                        addonBefore={
                            <div style={{ width: 78, textAlign: 'left' }}>objective</div>
                            // <Select defaultValue='objective' style={{ width: 100 }}
                            //     value={props.value.score.type} onChange={(type: ScoreType) => {
                            //         props.onChange({
                            //             score: {
                            //                 ...props.value.score,
                            //                 type,
                            //             }
                            //         })
                            //     }}>
                            //     <Select.Option key='objective' value='objective'>objective</Select.Option>
                            //     <Select.Option key='value' value='value'>value</Select.Option>
                            // </Select>
                        } 
                        />
                </div>
            </div>
        )
    } else if (props.value.type === 'selector') {
        return (
            <Input spellCheck={false} placeholder='必填项，请输入' allowClear
                addonBefore={<div style={{ width: 78, textAlign: 'left' }}>selector</div>}
                value={props.value.selector} onChange={(e) => {
                    const selector = e.target.value
                    props.onChange({
                        selector
                    })
                }} />
        )
    } else if (props.value.type === 'keybind') {
        return (
            <Select placeholder='必填项，请选择' allowClear  style={{ width: '100%' }}
                showSearch
                value={props.value.keybind}
                onChange={(keybind) => {
                    props.onChange({
                        keybind
                    })
                }}>
                {
                    KeybindList.map(item => {
                        return (
                            <Select.Option key={item.id} title={item.name + item.en} value={item.id}>{item.id} -- {item.en}</Select.Option>
                        )
                    })
                }
            </Select>
        )
    } else if (props.value.type === 'translate') {
        return (
            <div>
                <Input style={{ marginBottom: 10 }}
                    key='score'
                    spellCheck={false}
                    allowClear
                    placeholder='必填，使用%s或%n$s做占位替换'
                    value={props.value.translate.translate}
                    onChange={(e) => {
                        const translate = e.target.value
                        props.onChange({
                            translate: {
                                ...props.value.translate,
                                translate,
                            }
                        })
                    }}
                    addonBefore={
                        <div style={{ width: 78, textAlign: 'left' }}>translate</div>
                    } 
                    />
                <Input
                    key='score'
                    spellCheck={false}
                    allowClear
                    placeholder='选填'
                    value={props.value.translate.with}
                    onChange={(e) => {
                        props.onChange({
                            translate: {
                                ...props.value.translate,
                                with: e.target.value,
                            }
                        })
                    }}
                    addonBefore={
                        <div style={{ width: 78, textAlign: 'left' }}>with</div>
                    } 
                    />
            </div>
        )
    } else {
        return null
    }
}

const WrapperPanel = styled.div`
    z-index: 10;
    display: block;
    position: fixed;
    width: 600px;
    padding: 16px;
    border-radius: 8px;
    background-color: white;
    box-shadow: 0 0 5px #0000001a;
    animation: enter .35s ease-out 1;
    &::before {
        content: "";
        position: absolute;
        width: 0;
        height: 0;
        margin-left: .5em;
        right: -1em;
        top: 0;
        left: calc(50% + .25em);
        box-sizing: border-box;
        border: .5em solid black;
        border-color: transparent transparent #fff #fff;
        transform-origin: 0 0;
        transform: rotate(135deg);
        box-shadow: -3px 3px 3px #0000000d;
    }
    &.top::before {
        bottom: -13px;
        top: initial;
        left: calc(50% - .25em);
        transform: rotate(-45deg);
    }
   
    @keyframes enter {
        0% {
            transform: translateY(20px);
        }
        100% {
            transform: translateY(0);
        }
    }
`

export function Popup(props: {
    id: string
    editor: LexicalEditor;
}) {
    const boxRef = useRef<HTMLDivElement>(null)
    const [state, dispatch] = useContext(AppContext)

    const eventList = useMemo(
        () => {
            if (state.currentJson) {
                return state.currentJson.nodeKeys.map(nodeKey => {
                    return cacheEventMap.get(nodeKey)!
                })
            }
            return []
        },
        [state.currentJson, state.trigger]
    )
    
    const eventListItem = useMemo(
        () => {
            return eventList.filter(Boolean).find(item => item.id === props.id)
        },
        [eventList, props.id]
    )

    const updatePosition = useCallback(() => {
        props.editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
                const anchor = selection.anchor
                const focus = selection.focus
                const range = createDOMRange(
                    props.editor,
                    anchor.getNode(),
                    anchor.offset,
                    focus.getNode(),
                    focus.offset,
                )
                const boxElem = boxRef.current;
                if (range !== null && boxElem !== null) {
                    const { left, bottom, width } = range.getBoundingClientRect()
                    const selectionRects = createRectsFromDOMRange(props.editor, range)
                    let correctedLeft =
                        selectionRects.length === 1 ? left + width / 2 - 300 : left - 300
                    if (correctedLeft < 10) {
                        correctedLeft = 10;
                    }
                    if (bottom + 20 + boxElem.offsetHeight > innerHeight) {
                        boxElem.classList.add('top')
                        boxElem.style.top = `${bottom - 30 - boxElem.offsetHeight}px`
                    } else {
                        boxElem.style.top = `${bottom + 20}px`
                        boxElem.classList.remove('top')
                    }
                    boxElem.style.left = `${correctedLeft}px`
                }
            }
        })
    }, [props.id, props.editor])

    useEffect(() => {
        return bindEvent('resize', updatePosition)
    }, [props.editor, updatePosition])

    useEffect(
        () => {
            updatePosition()
        },
        [props.id, props.editor, updatePosition]
    )

    const update = useCallback(
        (partialState: Partial<JSONEventObject>) => {
            if (eventListItem) {
                const newEventListItem = partialUpdate(eventListItem, partialState)
                cacheEventMap.set(eventListItem.id, newEventListItem)
                dispatch({
                    type: 'UpdateTrigger'
                })
            }
        },
        [eventListItem]
    )

    const hoverPlacehoder = useMemo(() => {
        if (! eventListItem) {
            return ''
        }
        return {
            show_text: '选填，合法的json会被解析成组件',
            show_item: '选填，{ id, count, tag }',
            show_entity: '选填，{ name, type, id }',
        }[eventListItem.hoverEvent.action]
    }, [eventListItem?.hoverEvent?.action])

    if (! eventListItem) {
        return null
    }

    return (
        <WrapperPanel ref={boxRef}>
            <Row style={{ marginBottom: 10 }}>
                <Col span={4} style={{ textAlign: "right", paddingTop: 4 }}>类型：</Col>
                <Col span={20}>
                    <>
                        <Radio.Group defaultValue='text' value={eventListItem.type} onChange={(e) => {
                            const type = e.target.value
                            update({
                                type
                            })
                        }} style={{ marginTop: 5, marginBottom: 10 }}>
                            <Radio key='text' value="text">text</Radio>
                            <Radio key='nbt' value="nbt">nbt</Radio>
                            <Radio key='selector' value="selector">selector</Radio>
                            <Radio key='score' value="score">score</Radio>
                            <Radio key='keybind' value="keybind">keybind</Radio>
                            <Radio key='translate' value="translate">translate</Radio>
                        </Radio.Group>
                        <TypeComponent onChange={(partial) => {
                            update(partial)
                        }} value={eventListItem} />
                    </>
                </Col>
            </Row>
            <Row style={{ marginBottom: 10 }}>
                <Col span={4} style={{ textAlign: "right", paddingTop: 4 }}>点击click：</Col>
                <Col span={20}>
                    <Input
                        addonBefore={
                            <Select onChange={(action: ClickActionType) => {
                                update({
                                    clickEvent: {
                                        ...eventListItem.clickEvent,
                                        action,
                                    }
                                })
                            }} value={eventListItem.clickEvent.action} defaultValue='run_command' style={{ width: 100 }}>
                                <Select.Option value='run_command'>执行指令</Select.Option>
                                <Select.Option value='open_url'>打开网址</Select.Option>
                                <Select.Option value='suggest_command'>输入文本</Select.Option>
                                <Select.Option value='copy_to_clipboard'>复制内容</Select.Option>
                                <Select.Option value='change_page'>切换页码</Select.Option>
                            </Select>
                        }
                        placeholder='选填'
                        allowClear
                        value={eventListItem.clickEvent.value}
                        onChange={(e) => {
                            const value = e.target.value
                            update({
                                clickEvent: {
                                    ...eventListItem.clickEvent,
                                    value,
                                }
                            })
                        }} />
                </Col>
            </Row>
            <Row style={{ marginBottom: 10 }}>
                <Col span={4} style={{ textAlign: "right", paddingTop: 4 }}>悬浮hover：</Col>
                <Col span={20}>
                    <Input
                        addonBefore={
                            <Select onChange={(action: HoverTokenType) => {
                                update({
                                    hoverEvent: {
                                        ...eventListItem.hoverEvent,
                                        action,
                                    }
                                })
                            }} value={eventListItem.hoverEvent.action} defaultValue='show_text' style={{ width: 100 }}>
                                <Select.Option value='show_text'>text</Select.Option>
                                <Select.Option value='show_item'>item</Select.Option>
                                <Select.Option value='show_entity'>entity</Select.Option>
                            </Select>
                        }
                        placeholder={hoverPlacehoder}
                        allowClear
                        value={eventListItem.hoverEvent.value}
                        onChange={(e) => {
                            const value = e.target.value
                            update({
                                hoverEvent: {
                                    ...eventListItem.hoverEvent,
                                    value,
                                }
                            })
                        }} />

                </Col>
            </Row>
            <Row style={{ marginBottom: 10 }}>
                <Col span={4} style={{ textAlign: "right", paddingTop: 4 }}>insertion：</Col>
                <Col span={20}>
                    <Input placeholder='选填，shift点击文字填充到聊天栏'
                        allowClear
                        value={eventListItem.insertion}
                        onChange={(e) => {
                            const insertion = e.target.value
                            update({
                                insertion
                            })
                        }} />
                </Col>
            </Row>
            <Row style={{ marginBottom: 10 }}>
                <Col span={4} style={{ textAlign: "right", paddingTop: 4 }}>font：</Col>
                <Col span={20}>
                    <Input placeholder='选填'
                        allowClear
                        value={eventListItem.font}
                        onChange={(e) => {
                            const font = e.target.value
                            update({
                                font
                            })
                        }} />
                </Col>
            </Row>
        </WrapperPanel>
    )
}