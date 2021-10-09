import React, {
    CSSProperties,
    Key,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import styled from 'styled-components'
import { Row as RowType, DataGridProps } from './types'
import Context from './Context'
import Cell from './Cell'

interface GridRowProps extends React.HTMLAttributes<HTMLDivElement> {
    styled: CSSProperties
    isSelect: boolean
}

const GridRow = styled.div.attrs<GridRowProps>((props) => ({
    style: props.styled,
}))<GridRowProps>`
    position: absolute;
    transition: top 0.4s, height 0.4s, background-color 0.1s, opacity 1s,
        -webkit-transform 0.4s;
    :hover {
        > div {
            background-color: ${({ theme }) =>
                theme['grid-row-background-color:hover']};
        }
    }
    background-color: ${({ isSelect, theme }) =>
        isSelect
            ? theme['grid-row-background-color-select']
            : theme['grid-row-background-color']};
`

GridRow.defaultProps = {
    theme: {
        'grid-row-background-color': 'inherit',
        'grid-row-background-color-select': 'rgba(33, 150, 243, 0.3)',
        'grid-row-background-color:hover': 'rgba(33, 150, 243, 0.1)',
    },
}

interface RowProps<R>
    extends Pick<React.HTMLAttributes<HTMLDivElement>, 'style'> {
    rows: readonly RowType<R>[]
    rowIndex: number
    rowIndexCode: string
    width: number
    level: number
    scrollLeft: number
    scrollWidth: number
    isRowLast?: boolean[]
    isExpanded?: boolean
    styled: CSSProperties
    gridProps: DataGridProps<R>
}

function Row<T>({
    rows,
    rowIndex,
    scrollLeft,
    scrollWidth,
    styled: tempStyled = {},
    rowIndexCode,
    isExpanded = false,
    isRowLast = [],
    level,
    gridProps,
}: RowProps<T>) {
    const {
        defaultColumnWidth,
        columns = [],
        estimatedColumnWidth,
        cacheRemoveCount,
        width,
        onRowClick,
        onRowDoubleClick,
    } = gridProps
    const { cells, key, height } = rows[rowIndex]
    const { state, dispatch } = useContext(Context)
    const [opacity, setOpacity] = useState<number>(0)
    const fixedColumns = useMemo(
        () => columns.filter((ele) => ele.fixed),
        [columns]
    )

    const leftFixedColumns = fixedColumns.filter((ele) => ele.fixed === 'left')
    const rightFixedColumns = fixedColumns.filter(
        (ele) => ele.fixed === 'right'
    )

    useEffect(() => {
        setOpacity(1)
        return () => {
            setOpacity(0)
        }
    }, [])

    const renderCell = useMemo(() => {
        const result: Array<ReactNode> = []
        let left = 0
        const isMergeCell: Array<number> = []
        columns.some((column, index) => {
            let columnWidth = column.width || defaultColumnWidth
            if (
                left < scrollLeft - estimatedColumnWidth * cacheRemoveCount &&
                column.fixed === undefined
            ) {
                left += columnWidth
                return false
            }

            if (
                left + columnWidth >
                    width +
                        scrollLeft +
                        estimatedColumnWidth * cacheRemoveCount &&
                column.fixed === undefined
            ) {
                left += columnWidth
                return false
            }

            if (isMergeCell.includes(index)) {
                return false
            }

            let isCellSpan = false
            const cell = cells.find((ele) => ele.name === column.name)

            const colSpan = cell?.colSpan || 0

            if (colSpan > 0) {
                for (let i = 0; i < colSpan; i += 1) {
                    const columnIndex = index + i + 1
                    isMergeCell.push(columnIndex)
                    columnWidth +=
                        columns[columnIndex].width || defaultColumnWidth
                    isCellSpan = true
                }
            }

            const rowSpan = cell?.rowSpan || 0
            let rowHeight = height || 35
            if (rowSpan > 0) {
                for (let i = 0; i < rowSpan; i += 1) {
                    rowHeight += rows[rowIndex + i + 1].height || 35
                    isCellSpan = true
                }
            }

            const txt = cell?.value || ''

            const isSelect =
                state.selectPosition?.x === index &&
                state.selectPosition?.y === `${rowIndexCode}-${rowIndex}`

            let zIndex

            if (isCellSpan) {
                zIndex = 1
            }
            if (column.fixed) {
                zIndex = 2
            }

            const cellStyled: CSSProperties = {
                left,
                zIndex,
                width: columnWidth,
                height: rowHeight,
                lineHeight: `${rowHeight}px`,
            }

            if (column.fixed === 'right') {
                cellStyled.left = undefined
                cellStyled.float = 'right'
                cellStyled.right =
                    scrollWidth - left - (column.width || defaultColumnWidth)
            }

            result.push(
                <Cell<T>
                    key={`${key}-${column.name}`}
                    column={column}
                    level={level}
                    isRowLast={isRowLast}
                    isExpanded={isExpanded}
                    style={cell?.style}
                    styled={{
                        ...cellStyled,
                        position: column.fixed ? 'sticky' : undefined,
                    }}
                    isLastFeftFixed={
                        leftFixedColumns.length > 0 &&
                        leftFixedColumns[leftFixedColumns.length - 1].name ===
                            column.name
                    }
                    isLastRightFixed={
                        rightFixedColumns.length > 0 &&
                        rightFixedColumns[0].name === column.name
                    }
                    isSelect={isSelect}
                    onClick={() => {
                        if (column.isSelect?.(cell) !== false) {
                            dispatch({
                                type: 'setSelectPosition',
                                payload: {
                                    x: index,
                                    y: `${rowIndexCode}-${rowIndex}`,
                                },
                            })
                        }
                    }}
                    row={rows[rowIndex]}
                    value={txt}
                    girdProps={gridProps}
                    onFocus={() => {
                        // if (column.isSelect?.(cell) !== false) {
                        //     dispatch({
                        //         type: 'setSelectPosition',
                        //         payload: {
                        //             x: index,
                        //             y: `${rowIndexCode}-${rowIndex}`,
                        //         },
                        //     })
                        // }
                    }}
                />
            )

            left += columnWidth

            return false
        })
        return result
    }, [
        columns,
        estimatedColumnWidth,
        cacheRemoveCount,
        scrollLeft,
        isRowLast,
        state.selectPosition,
    ])

    return (
        <GridRow
            role="row"
            styled={{ ...tempStyled, opacity }}
            isSelect={gridProps.selectedRows.includes(key)}
            onClick={(e) => {
                onRowClick?.(rows[rowIndex])
                // 单击行的时候也可以高亮行

                if (gridProps.select) {
                    let newSelect: Key[] = []
                    if (e.ctrlKey) {
                        if (gridProps.select.mode === 'multiple') {
                            newSelect = [...gridProps.selectedRows]
                        }
                    }
                    const selectIndex = newSelect.indexOf(key)
                    if (selectIndex >= 0) {
                        newSelect.splice(selectIndex, 1)
                    } else {
                        newSelect.push(key)
                    }
                    gridProps.onChangeSelectedRows(newSelect)
                }
            }}
            onDoubleClick={() => {
                onRowDoubleClick?.(rows[rowIndex])
            }}
        >
            {renderCell}
        </GridRow>
    )
}

export default Row
