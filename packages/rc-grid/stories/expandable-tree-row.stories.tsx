import React, { useState } from 'react'
import { Meta } from '@storybook/react'

import DataGrid, { Row, Column, Cell, AutoSize } from '../src'

const rows: Array<Row<any>> = []
const tempColumns: Array<Column<unknown>> = []

for (let i = 2; i < 10; i += 1) {
    tempColumns.push({
        name: `${i}`,
        title: `字段 - ${i}`,
        width: 200,
        resizable: true,
    })
}

for (let i = 0; i < 1; i += 1) {
    const cells: Array<Cell> = []

    const object: any = {}
    for (let y = 0; y < tempColumns.length; y += 1) {
        object[`${y}`] = `${i} - ${y}`
        if (i === 3 && y === 2) {
            cells.push({
                name: `${y}`,
                value: `${i} - ${y}`,
                style: {},
            })
        } else if (i === 8 && y === 2) {
            cells.push({
                name: `${y}`,
                value: `${i} - ${y}`,
                style: {},
            })
        } else {
            cells.push({
                name: `${y}`,
                value: `${i} - ${y}`,
            })
        }
    }
    rows.push({
        height: 35,
        key: `${i}`,
        object,
        cells,
    })
}

const RowDataGrid = () => {
    const [columns, setColumns] = useState<Array<Column<unknown>>>(tempColumns)
    return (
        <AutoSize>
            {(width, height) => (
                <DataGrid<unknown>
                    rows={rows}
                    width={width}
                    height={height}
                    columns={columns}
                    onHeaderResizable={(changeColumns) => {
                        setColumns(changeColumns)
                    }}
                    tree={{
                        showLine: true,
                        childrenColumnName: '2',
                        onChildrenRows: (row) => {
                            const tempRow = []
                            for (let i = 0; i < 10; i += 1) {
                                const cells: Array<Cell> = []
                                const object: any = {}
                                for (
                                    let y = 0;
                                    y < tempColumns.length;
                                    y += 1
                                ) {
                                    object[`${y}`] = `${i} - ${y}`
                                    if (i === 3 && y === 2) {
                                        cells.push({
                                            name: `${y}`,
                                            value: `${i} - ${y}`,
                                            style: {},
                                        })
                                    } else if (i === 8 && y === 2) {
                                        cells.push({
                                            name: `${y}`,
                                            value: `${i} - ${y}`,
                                            style: {},
                                        })
                                    } else {
                                        cells.push({
                                            name: `${y}`,
                                            value: `${i} - ${y}`,
                                        })
                                    }
                                }
                                tempRow.push({
                                    height: 35,
                                    key: `${row.key}-${i}`,
                                    object,
                                    cells,
                                })
                            }
                            return tempRow
                        },
                    }}
                />
            )}
        </AutoSize>
    )
}

export default {
    component: RowDataGrid,
    title: 'Demos',
} as Meta

export const TreeRow: React.VFC<{}> = () => <RowDataGrid />
