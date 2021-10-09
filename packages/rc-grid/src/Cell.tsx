import React, {
    CSSProperties,
    Key,
    useCallback,
    useContext,
    useMemo,
} from 'react'
import styled from 'styled-components'
import Context from './Context'
import { useChevronDownIcon, useChevronRightIcon } from './Icon'
import { Column, DataGridProps, EditorChange, EditorValue, Row } from './types'
import { writeClipboardText } from './utils/browser'

const ExpandableIcon = styled.i`
    width: 16px;
    height: 16px;
    margin-right: 1rem;
    cursor: pointer;
`

function useExpandableRender<T>(
    row: Row<T>,
    isExpandable: (data: Row<T>) => boolean,
    level: number
) {
    const { state, dispatch } = useContext(Context)
    let icon = useChevronRightIcon()

    if (!isExpandable?.(row)) {
        return null
    }

    const expandable = state.expandableTreeKey.includes(row.key)

    if (expandable) {
        icon = useChevronDownIcon()
    }

    return (
        <ExpandableIcon
            style={{
                marginLeft: `${level}rem`,
                marginRight: '0.5rem',
            }}
            onClick={() => {
                const newKeys: Key[] = []
                if (expandable) {
                    state.expandableTreeKey.forEach((ele) => {
                        if (ele !== row.key) {
                            newKeys.push(ele)
                        }
                    })
                } else {
                    newKeys.push(...state.expandableTreeKey, row.key)
                }
                dispatch({
                    type: 'setExpandableTreeKey',
                    payload: newKeys,
                })
            }}
        >
            {icon}
        </ExpandableIcon>
    )
}

function useExpandableTreeLineRender(
    level: number,
    height: number,
    isRowLast: boolean[],
    isExpanded: boolean
) {
    // 垂直线
    const lines = new Array(level + 1).fill(0).map((v, index: number) => (
        <div
            key={Math.random()}
            style={{
                position: 'absolute',
                left: `${index + 1}rem`,
                top: `${index === level ? height / 2 : 0}px`,
                bottom: 0,
                width: 0.1,
                height: `${level === 0 ? height / 2 : height}px`,
                opacity: 1,
                borderLeft: '0.5px dashed rgb(188 188 188 / 50%)',
            }}
        />
    ))

    isRowLast.forEach((v, i) => {
        if (v && i !== isRowLast.length - 1) {
            lines[i - 1] = <></>
        }
    })

    if (!isExpanded) {
        lines.pop()
        if (isRowLast[isRowLast.length - 1]) {
            lines.pop()
            lines.push(
                <div
                    key={Math.random()}
                    style={{
                        position: 'absolute',
                        left: `${isRowLast.length - 1}rem`,
                        top: 0,
                        bottom: 0,
                        width: 0.1,
                        height: `${height / 2}px`,
                        opacity: 1,
                        borderLeft: '0.5px dashed rgb(188 188 188 / 50%)',
                    }}
                />
            )
        }
    }

    if (isExpanded && isRowLast[isRowLast.length - 1]) {
        lines[lines.length - 2] = (
            <div
                key={Math.random()}
                style={{
                    position: 'absolute',
                    left: `${lines.length - 1}rem`,
                    top: 0,
                    bottom: 0,
                    width: 0.1,
                    height: `${height / 2}px`,
                    opacity: 1,
                    borderLeft: '0.5px dashed rgb(188 188 188 / 50%)',
                }}
            />
        )
    }
    // 水平线
    if (level !== 0) {
        lines.push(
            <div
                key={Math.random()}
                style={{
                    position: 'absolute',
                    left: `${level}rem`,
                    top: 17,
                    bottom: 17,
                    width: `${0.5}rem`,
                    height: 1,
                    opacity: 1,
                    borderTop: '0.3px dashed rgb(188 188 188 / 50%)',
                }}
            />
        )
    }

    return lines
}

interface GridCellProps extends React.HTMLAttributes<HTMLDivElement> {
    isLastFeftFixed: boolean
    isLastRightFixed: boolean
    isSelect: boolean
    readonly: boolean
    styled: CSSProperties
}

const GridCell = styled.div.attrs<GridCellProps>((props) => ({
    style: props.styled,
}))<GridCellProps>`
    display: inline-block;
    position: absolute;
    border-right: ${({ theme }) => theme['grid-row-cell-border-right']};
    border-bottom: ${({ theme }) => theme['grid-row-cell-border-bottom']};
    box-sizing: border-box;
    outline: none;
    background-color: ${({ readonly, theme }) => {
        if (readonly) {
            return theme['grid-row-cell-background-color-readonly']
        }
        return 'inherit'
    }};
    user-select: none;
    box-shadow: ${({ isLastFeftFixed, isLastRightFixed, isSelect, theme }) => {
        if (isSelect) {
            return theme['grid-row-cell-select']
        }
        if (isLastFeftFixed) {
            return '2px 0 5px -2px rgb(136 136 136 / 30%)'
        }
        if (isLastRightFixed) {
            return '-3px 0 5px -2px rgb(136 136 136 / 30%)'
        }
        return undefined
    }};

    /** 优化 webkit 中的渲染效率 */
    content-visibility: auto;
    padding: 0px 8px;
    white-space: nowrap;
    text-overflow: ellipsis;

    overflow: hidden;
    height: 100%;
`

GridCell.defaultProps = {
    theme: {
        'grid-row-cell-border-right': '1px solid #ddd',
        'grid-row-cell-border-bottom': '1px solid #ddd',
        // 'grid-row-cell-background-color-readonly': 'hsl(0deg 0% 97%)',
        'grid-row-cell-select': 'inset 0 0 0 1px #66afe9',
    },
}

export interface CellProps<T> extends React.HTMLAttributes<HTMLDivElement> {
    isLastFeftFixed: boolean
    isLastRightFixed: boolean
    isSelect: boolean
    styled: CSSProperties
    column: Column<T>
    value: EditorValue
    row: Row<T>
    isRowLast?: boolean[]
    level: number
    isExpanded?: boolean
    girdProps: DataGridProps<T>
}

function Cell<T>({
    isLastFeftFixed,
    isLastRightFixed,
    isSelect,
    styled: tempStyled,
    onClick,
    column,
    style,
    row,
    isRowLast = [],
    isExpanded = false,
    value: defaultValue,
    level,
    girdProps: { onEditorChangeSave, tree },
}: CellProps<T>) {
    const { state, dispatch } = useContext(Context)

    const changeData = state?.editorChange?.find(
        (ele) => ele.row.key === row.key
    )

    let value = defaultValue
    const changeValue = changeData?.changeValue[column.name]
    if (changeData && changeValue) {
        value = changeValue
    }

    let readonly = false

    if (
        (typeof column.readonly === 'function' &&
            column.readonly(row) === true) ||
        column.readonly === true
    ) {
        readonly = true
    }

    const rowKey = row.key
    const colName = column.name

    if (
        column.editor &&
        state.editPosition?.colName === colName &&
        state.editPosition?.rowKey === rowKey &&
        readonly === false
    ) {
        const Editor = column.editor
        // 如果是双击进入或者回车进入，默认选中全部值，如果不是前面两种情况那么就是键入，删除原本的值
        const displayValue =
            state.editPosition.actionType === 'click' ||
            state.editPosition.key === 'Enter'
                ? value
                : ''
        return (
            <GridCell
                styled={{
                    ...tempStyled,
                    display: 'inline-flex',
                    padding: 0,
                }}
                readonly={false}
                role="gridcell"
                isLastFeftFixed={isLastFeftFixed}
                isLastRightFixed={isLastRightFixed}
                tabIndex={-1}
                isSelect={false}
            >
                <Editor
                    style={{
                        flex: 1,
                        width: '100%',
                        outline: '#fff solid 2px',
                        border: 'none',
                        boxShadow: 'inset 0 0 0 1px #66afe9',
                    }}
                    value={displayValue}
                    onEditCompleted={(newValue) => {
                        dispatch({
                            type: 'setEditPosition',
                            payload: {},
                        })
                        const data: EditorChange<T> = {
                            row,
                            changeValue: {
                                [column.name]: newValue,
                            } as unknown as T,
                        }

                        if (changeData) {
                            changeData.changeValue = {
                                ...changeData.changeValue,
                                ...data.changeValue,
                            }
                        } else {
                            state.editorChange.push(data)
                        }

                        dispatch({
                            type: 'setEditorChange',
                            payload: [...state.editorChange],
                        })

                        onEditorChangeSave?.(data)
                    }}
                />
            </GridCell>
        )
    }

    const renderChild = () => {
        if (column.render) {
            return column.render(defaultValue, row)
        }
        return value
    }

    const renderTreeExpandableIcon = () => {
        if (tree?.childrenColumnName === column.name) {
            return useExpandableRender(row, () => true, level)
        }
        return null
    }

    const renderLine = useMemo(() => {
        if (tree?.childrenColumnName === column.name && tree?.showLine) {
            return useExpandableTreeLineRender(
                level,
                row.height,
                isRowLast,
                isExpanded
            )
        }

        return null
    }, [])

    return (
        <GridCell
            style={style}
            role="gridcell"
            readonly={!(column.editor && readonly === false)}
            styled={tempStyled}
            isLastFeftFixed={isLastFeftFixed}
            isLastRightFixed={isLastRightFixed}
            isSelect={isSelect}
            tabIndex={-2}
            onKeyDown={(e) => {
                const { currentTarget } = e

                if (e.key === 'c' && e.ctrlKey) {
                    writeClipboardText(currentTarget.textContent)
                    currentTarget.style.opacity = '.6'
                    setTimeout(() => {
                        currentTarget.style.removeProperty('opacity')
                        currentTarget.focus()
                    }, 100)
                    e.preventDefault()
                }

                // 如果键盘code是英文和number就进入编辑状态
                if (
                    e.code.startsWith('Key') ||
                    e.code.startsWith('Digit') ||
                    e.code.startsWith('Numpad')
                ) {
                    if (isSelect) {
                        dispatch({
                            type: 'setEditPosition',
                            payload: {
                                rowKey,
                                colName,
                                actionType: 'keyDown',
                            },
                        })
                    }
                }

                // 如果是回车键进入编辑状态
                if (e.code === 'Enter') {
                    if (isSelect) {
                        dispatch({
                            type: 'setEditPosition',
                            payload: {
                                rowKey,
                                colName,
                                actionType: 'keyDown',
                                key: 'Enter',
                            },
                        })
                    }
                }
            }}
            onClick={(e) => {
                if (isSelect) {
                    dispatch({
                        type: 'setEditPosition',
                        payload: {
                            rowKey,
                            colName,
                            actionType: 'click',
                        },
                    })
                }
                onClick?.(e)
            }}
        >
            {renderLine}
            {renderTreeExpandableIcon()}
            {renderChild()}
        </GridCell>
    )
}

export default Cell
