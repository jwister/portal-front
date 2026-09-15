import type { ReactNode } from 'react'

interface Column<T> {
  title: ReactNode
  dataIndex?: string
  key?: string
  width?: string | number
  // A column's value type depends on dataIndex; its existing renderer owns that conversion.
  render?: (value: any, record: T) => ReactNode
}

/** One semantic table, presented as labeled records on narrow screens. */
export function ResponsiveTable<T extends object>({ columns, dataSource, rowKey }: { columns: Column<T>[]; dataSource: T[]; rowKey: keyof T | ((row: T) => string); pagination?: false }) {
  return <table className="console-responsive-table" role="table">
    <thead role="rowgroup"><tr role="row">{columns.map((column, index) => <th key={index} scope="col" role="columnheader">{column.title}</th>)}</tr></thead>
    <tbody role="rowgroup">{dataSource.map((row) => <tr role="row" key={typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey])}>
      {columns.map((column, index) => {
        const value = column.dataIndex ? (row as Record<string, unknown>)[column.dataIndex] : undefined
        return <td role="cell" key={index} className={column.key === 'actions' ? 'console-table-actions' : undefined}>
          <span className="console-cell-label" aria-hidden="true">{column.title}</span>
          <div className="console-cell-value">{column.render ? column.render(value, row) : value as ReactNode}</div>
        </td>
      })}
    </tr>)}</tbody>
  </table>
}
