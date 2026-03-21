import React, { ReactNode } from 'react'
import { ArtColumn } from '../../interfaces'
import { internals } from '../../internals'
import { mergeCellProps } from '../../utils'
import { flatMap } from '../../utils/others'
import { TablePipeline } from '../pipeline'

export interface RowPopoverFeatureOptions {
  /** 弹框组件属性 */
  popoverProps?: any;
  /** 弹框内容的渲染方法 */
  renderPopover?(row: any, rowIndex: number): ReactNode
  /** 弹框挂载的列 */
  mountColCode?: string;
  /** 无需触发弹框的列 */
  excludeColCodes?: string[];
}

const rowPopoverSymbol = Symbol('row-popover')

const fallbackRenderPopover = () => (
  <div style={{ margin: '8px 24px' }}>
    <b style={{ color: 'indianred' }}>
      设置 <code>rowPopover.renderPopover</code> 来自定义详情内容
    </b>
  </div>
)

export function rowPopover(opts: RowPopoverFeatureOptions = {}) {
  return function rowPopoverStep(pipeline: TablePipeline) {
    const Popover = pipeline.ctx.components.Popover
    if (Popover == null) {
      throw new Error('使用 rowPopover 之前需要设置 pipeline.ctx.components.Popover')
    }
    const stateKey = 'rowPopover'

    const primaryKey = pipeline.ensurePrimaryKey(stateKey) as string
    if (typeof primaryKey !== 'string') {
      throw new Error(`${stateKey} 仅支持字符串作为 primaryKey`)
    }

    const renderPopover = opts.renderPopover ?? fallbackRenderPopover

    const openKeys: string[] = pipeline.getStateAtKey(stateKey) ?? []
    const onChangeOpenKeys = (nextKeys: string[], key: string, action: string) => {
      pipeline.setStateAtKey(stateKey, nextKeys, { key, action })
    }

    const openKeySet = new Set(openKeys)

    const toggle = (rowKey: string, flag: boolean) => {
      if (!flag) {
        onChangeOpenKeys(
          openKeys.filter((key) => key !== rowKey),
          rowKey,
          'mouseleave',
        )
      } else {
        onChangeOpenKeys([rowKey], rowKey, 'mouseenter')
      }
    }

    return pipeline
      .dataSource(
        flatMap(pipeline.getDataSource(), (row, rowIndex) => {
          if (openKeySet.has(row[primaryKey])) {
            return [{ [rowPopoverSymbol]: true, ...row }]
          } else {
            return [row]
          }
        }),
      )
      .columns(processColumns(pipeline.getColumns()))

    function processColumns(columns: ArtColumn[]) {
      if (columns.length === 0) {
        return columns
      }

      const render = (mountCol: ArtColumn, value: any, row: any, rowIndex: number) => {
        const content = internals.safeRender(mountCol, row, rowIndex)
        if (!row[rowPopoverSymbol]) {
          return content
        }

        const rowKey = row[primaryKey]
        const expanded = openKeySet.has(rowKey)

        return (
          <Popover
            visible={expanded}
            {...opts.popoverProps}
            content={renderPopover(row, rowIndex)}
          >
            {content}
          </Popover>
        )
      }

      return columns.map((column, columnIndex) => {
        // 弹框挂载列
        if (opts.mountColCode ? (opts.mountColCode === column.code) : (columnIndex === 0)) {
          return {
            ...column,
            getCellProps(value: any, record: any, rowIndex: number) {
              const prevGetCellProps = column.getCellProps
              const prevCellProps = prevGetCellProps?.(value, record, rowIndex)
              const rowKey = record[primaryKey]
  
              return mergeCellProps(prevCellProps, {
                onMouseEnter() {
                  toggle(rowKey, true)
                },
                onMouseLeave() {
                  toggle(rowKey, false)
                },
              })
            },
            render: (value: any, record: any, rowIndex: number) => render(column, value, record, rowIndex),
          }
        }

        // 禁用弹框挂载列
        if (Array.isArray(opts.excludeColCodes) && opts.excludeColCodes.includes(column.code)) {
          return column;
        }

        return {
          ...column,
          getCellProps(value: any, record: any, rowIndex: number) {
            const prevGetCellProps = column.getCellProps
            const prevCellProps = prevGetCellProps?.(value, record, rowIndex)
            const rowKey = record[primaryKey]

            return mergeCellProps(prevCellProps, {
              onMouseEnter() {
                toggle(rowKey, true)
              },
              onMouseLeave() {
                toggle(rowKey, false)
              },
            })
          },
        }
      })
    }
  }
}
