import { $getRoot, COMMAND_PRIORITY_CRITICAL, LexicalCommand, NodeKey, REDO_COMMAND, UNDO_COMMAND, } from 'lexical';
import { $createMarkNode, $getMarkIDs, $isMarkNode, $unwrapMarkNode, $wrapSelectionInMarkNode, MarkNode, } from '@lexical/mark';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import { $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_EDITOR, createCommand, } from 'lexical';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createThread, Thread } from './model';
import { Popup } from './Popup';
import { JSONEventObject, AppContext, createJSONEventObject } from '../../../../store'
import { clone } from '../../../../utils';


export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand()
export const cacheEventMap = new Map<string, JSONEventObject>()
export const nodeKeyMap = new Map<string, NodeKey>()

export default function CommentPlugin() {
    const [editor] = useLexicalComposerContext()
    const [activeID, setActiveID] = useState<string | null>(null)
    const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>(null)
    const [state, dispatch] = useContext(AppContext)
    const [canShowPopup, setCanShowPopup] = useState(true)

    // const remove = useCallback(
    //     (comment: JSONEventObject, thread?: any) => {
    //         // Remove ids from associated marks
    //         const id = thread !== undefined ? thread.id : comment.id
    //         const key = nodeMap[id]
    //         if (key !== undefined) {
    //             // Do async to avoid causing a React infinite loop
    //             setTimeout(() => {
    //                 editor.update(() => {
    //                     const node: null | MarkNode = $getNodeByKey(key)
    //                     if ($isMarkNode(node)) {
    //                         node.deleteID(id);
    //                         if (node.getIDs().length === 0) {
    //                             $unwrapMarkNode(node)
    //                         }
    //                     }
    //                 });
    //             });
    //         }
    //     },
    //     [editor, nodeMap],
    // )

    // useEffect(() => {
    //     // 移除多于的数据
    //     function handle() {
    //         editor.getEditorState().read(() => {
    //             const ids = $getRoot().getChildren().filter(node => $isMarkNode(node)).map((node) => (node as MarkNode).getIDs()[0])
    //             const eventList = state.eventList
    //             const nodeMap = state.nodeMap
    //             dispatch({
    //                 type: 'UpdateEvent',
    //                 eventList,
    //             })
    //             dispatch({
    //                 type: 'UpdateNodeMap',
    //                 nodeMap,
    //             })
    //         })
    //     }
    //     window.addEventListener('load', handle)
    //     return () => {
    //         window.removeEventListener('load', handle)
    //     }
    // }, [])

    const add = useCallback((thread: JSONEventObject | Thread) => {
            editor.update(() => {
                const selection = $getSelection()

                if ($isRangeSelection(selection)) {
                    const selectedNodes = selection.getNodes()
                    // 存在markNode直接返回
                    for (const node of selectedNodes) {
                        if ($isMarkNode(node)) {
                            return
                        }
                        if ($isTextNode(node) && $isMarkNode(node.getParent())) {
                            return
                        }
                    }

                    const focus = selection.focus;
                    const anchor = selection.anchor;
                    const id = thread.id;
                    const isBackward = selection.isBackward()

                    $wrapSelectionInMarkNode(selection, isBackward, id)

                    if (! isBackward) {
                        focus.set(anchor.key, anchor.offset, anchor.type)
                    } else {
                        anchor.set(focus.key, focus.offset, focus.type)
                    }
                }
            })
        },
        [editor],
    );

    useEffect(() => {
        // 选择激活的markNode
        setCanShowPopup(true)
        const changedElems: HTMLElement[] = [];
        if (activeID) {
            const key = nodeKeyMap.get(activeID)
            if (key !== undefined) {
                const elem = editor.getElementByKey(key)
                if (elem !== null) {
                    elem.classList.add('selected')
                    changedElems.push(elem)
                }
            }
        }
        return () => {
            for (let i = 0; i < changedElems.length; i++) {
                const changedElem = changedElems[i];
                changedElem.classList.remove('selected')
            }
        };
    }, [activeID, editor])


    // useEffect(() => {
    //     Object.keys(state.nodeMap).forEach(key => {
    //         if (cacheEventMap.has(key)) {
    //             dispatch({
    //                 type: 'AddEvent',
    //                 eventListItem: {
    //                     ...cacheEventMap.get(key)!
    //                 }
    //             })
    //             cacheEventMap.delete(key)
    //         }
    //     })
    // }, [])

    useEffect(() => {
        const markNodeKeysToIDs: Record<NodeKey, string> = {}

        return mergeRegister(
            registerNestedElementResolver<MarkNode>(
                editor,
                MarkNode,
                (from: MarkNode) => {
                    return $createMarkNode(from.getIDs())
                },
                (from: MarkNode, to: MarkNode) => {
                    // Merge the IDs
                    const ids = from.getIDs()
                    ids.forEach((id) => {
                        to.addID(id)
                    })
                },
            ),
            editor.registerMutationListener(MarkNode, (mutations) => {
                editor.getEditorState().read(() => {
                    // mutations.length -> 2
                    if (mutations.size === 2) {
                        let cloneId: NodeKey | undefined
                        for (const [key, mutation] of mutations) {
                            const node: null | MarkNode = $getNodeByKey(key)
                            if ($isMarkNode(node)) {
                                if (mutation === 'updated') {
                                    cloneId = node.getIDs()[0]
                                } else if (mutation === 'created') {
                                    if (cloneId) {
                                        const thread = createThread()
                                        const newEvent = clone(cacheEventMap.get(cloneId)!)
                                        newEvent.id = thread.id
                                        cacheEventMap.set(thread.id, newEvent)
                                        editor.update(() => {
                                            nodeKeyMap.set(thread.id, key)
                                            node.deleteID(node.getIDs()[0])
                                            node.addID(thread.id)
                                        })
                                    }
                                }
                            }
                        }
                    // mutations.length -> 1
                    } else {
                        for (const [key, mutation] of mutations) {
                            const node: null | MarkNode = $getNodeByKey(key)
                            let id: NodeKey | undefined = undefined
    
                            if (mutation === 'destroyed') {
                                id = markNodeKeysToIDs[key]
                            } else if ($isMarkNode(node)) {
                                id = node.getIDs()[0]
                            }
    
                            if (id) {
                                let markNodeKey = nodeKeyMap.get(id)
                                markNodeKeysToIDs[key] = id
    
                                if (mutation === 'destroyed') {
                                    if (markNodeKey !== undefined) {
                                        nodeKeyMap.delete(id)
                                    }
                                } else {
                                    nodeKeyMap.set(id, key)
                                }
                            }
                        }
                    }
                })
            }),
            // 获取激活的id
            editor.registerUpdateListener(({ editorState, tags }) => {
                editorState.read(() => {
                    const selection = $getSelection()
                    let hasActiveIds = false
                    let hasAnchorKey = false

                    if ($isRangeSelection(selection)) {
                        const anchorNode = selection.anchor.getNode()

                        if ($isTextNode(anchorNode)) {
                            const ids = $getMarkIDs(
                                anchorNode,
                                selection.anchor.offset,
                            )

                            if (ids !== null && selection.anchor.offset !== 0) {
                                setActiveID(ids[0])
                                hasActiveIds = true
                            }
                            if (selection.isCollapsed()) {
                                setActiveAnchorKey(anchorNode.getKey())
                                hasAnchorKey = true
                            }
                        }
                        if (! hasActiveIds) {
                            setActiveID(null)
                        }
                        if (! hasAnchorKey) {
                            setActiveAnchorKey(null)
                        }
                    }
                });
            }),
            // 注册命令
            editor.registerCommand(
                INSERT_INLINE_COMMAND,
                () => {
                    const domSelection = window.getSelection()
                    if (domSelection !== null) {
                        domSelection.removeAllRanges()
                    }
                    const thread = createThread()
                    add(thread)
                    cacheEventMap.set(thread.id, createJSONEventObject(thread.id))
                    dispatch({
                        type: 'AddNodeKey',
                        nodeKey: thread.id
                    })
                    // dispatch({ type: 'CreateEvent', id: thread.id })
                    return true
                },
                COMMAND_PRIORITY_EDITOR,
            ),
        )
    }, [editor])
    
    useEffect(
        () => {
            return mergeRegister(
                editor.registerCommand(
                    UNDO_COMMAND,
                    (payload) => {
                        setCanShowPopup(false)
                        return false
                    },
                    COMMAND_PRIORITY_CRITICAL
                ),
                editor.registerCommand(
                    REDO_COMMAND,
                    (payload) => {
                        setCanShowPopup(false)
                        return false
                    },
                    COMMAND_PRIORITY_CRITICAL
                ),
            )
        },
        [editor]
    )

    return (
        <>
            {
                canShowPopup && !!activeID && !!activeAnchorKey && (
                    <Popup id={activeID} editor={editor} />
                )
            }
        </>
    )
}