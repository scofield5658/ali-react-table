import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import {
  appendFillRemainingWidthColumn,
  takeFillRemainingWidthColumn,
} from '../../fillRemainingWidth'
import { ArtColumn } from '../../interfaces'
import { internals } from '../../internals'
import { collectNodes, makeRecursiveMapper, mergeCellProps } from '../../utils'
import { TablePipeline } from '../pipeline'

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

interface ResizeHandleProps extends React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>> {
  'var-handleBackground'?: string
  'var-handleHoverBackground'?: string
}

const ResizeHandle = styled.span<ResizeHandleProps>`
  position: absolute;
  top: 0;
  bottom: 0;
  right: -5px;
  width: 10px;
  cursor: col-resize;
  touch-action: none;
  z-index: 1;
  transition: background-color 200ms;

  background: ${(props) => {
    return props['var-handleBackground']
  }};

  &:hover {
    background: ${(props) => {
      return props['var-handleHoverBackground']
    }};
  }
`

export interface ColumnResizeFeatureOptions {
  /** 非受控用法：默认的列宽数组 */
  defaultSizes?: number[]

  /** 受控用法：列宽数组 */
  sizes?: number[]
  /** 受控用法：修改宽度的回调函数 */
  onChangeSizes?(nextSizes: number[]): void

  /** 列的最小宽度，默认为 60 */
  minSize?: number
  /** 如果列宽数组中没有提供有效的宽度，fallbackSize 将作为该列的宽度，默认为 150 */
  fallbackSize?: number
  /** 列的最大宽度，默认为 1000 */
  maxSize?: number

  /** 是否在调整列宽时禁用 user-select，默认为 true */
  disableUserSelectWhenResizing?: boolean

  /** 把手的背景色 */
  handleBackground?: string
  /** 鼠标悬停时，把手的背景色 */
  handleHoverBackground?: string
  /** 把手激活时的背景色 */
  handleActiveBackground?: string
}

/** 结束一次拖拽：commit 为 true 时提交最后一次未提交的列宽 */
type StopResize = (commit: boolean) => void

interface ColumnResizeHandleProps extends ResizeHandleProps {
  /** 开始一次拖拽；拖拽正常结束时会调用 onFinish，返回值用于提前结束 */
  onStartResize(e: React.PointerEvent<HTMLSpanElement>, onFinish: () => void): StopResize
}

/** 把手在卸载时结束仍在进行的拖拽，避免遗留 window 监听与 user-select 状态 */
function ColumnResizeHandle({ onStartResize, ...rest }: ColumnResizeHandleProps) {
  const stopRef = useRef<StopResize>()
  useEffect(() => () => stopRef.current?.(false), [])

  return (
    <ResizeHandle
      {...rest}
      onPointerDown={(e: React.PointerEvent<HTMLSpanElement>) => {
        if (e.button !== 0 || stopRef.current) {
          return
        }
        stopRef.current = onStartResize(e, () => {
          stopRef.current = undefined
        })
      }}
    />
  )
}

export function columnResize(opts: ColumnResizeFeatureOptions = {}) {
  const stateKey = 'columnResize'
  const disableUserSelectWhenResizing = opts.disableUserSelectWhenResizing ?? true
  const minSize = opts.minSize ?? 60
  const fallbackSize = opts.fallbackSize ?? 150
  const maxSize = opts.maxSize ?? 1000

  return function columnResizeFeature(pipeline: TablePipeline) {
    const sizes = opts.sizes ?? pipeline.getStateAtKey(stateKey) ?? opts.defaultSizes ?? []
    const { columns, fillColumn } = takeFillRemainingWidthColumn(pipeline.getColumns())
    const leafColumns = collectNodes(columns, 'leaf-only')
    leafColumns.forEach((col, colIndex) => {
      if (sizes[colIndex] == null) {
        if (typeof col.width === 'number') {
          sizes[colIndex] = col.width
        } else {
          sizes[colIndex] = fallbackSize
        }
      }
    })

    const onChangeSizes = (nextSizes: number[]) => {
      pipeline.setStateAtKey(stateKey, nextSizes)
      opts.onChangeSizes?.(nextSizes)
    }

    const computeSizes = (startIndex: number, endIndex: number, deltaSum: number) => {
      const nextSizes = sizes.slice()
      const sizeSum = sizes.slice(startIndex, endIndex).reduce((sum, s) => sum + s, 0)
      let deltaRemaining = deltaSum

      for (let colIndex = startIndex; colIndex < endIndex - 1; colIndex++) {
        const startSize = sizes[colIndex]
        // 将每一列的宽度变化量 都四舍五入至 整数，不然看起来非常难受
        const colDelta = Math.round(deltaSum * (startSize / sizeSum))
        nextSizes[colIndex] = clamp(minSize, startSize + colDelta, maxSize)
        deltaRemaining -= colDelta
      }
      // 因为前面的列宽都进行了四舍五入，最后一列的变化量需要使用 deltaRemaining 以避免误差
      nextSizes[endIndex - 1] = clamp(minSize, sizes[endIndex - 1] + deltaRemaining, maxSize)

      return nextSizes
    }

    const startResize = (
      startIndex: number,
      endIndex: number,
      e: React.PointerEvent<HTMLSpanElement>,
      onFinish: () => void,
    ): StopResize => {
      const startX = e.clientX
      const target = e.currentTarget

      let prevUserSelect = ''
      let docElemStyle: CSSStyleDeclaration

      if (disableUserSelectWhenResizing) {
        docElemStyle = document.documentElement.style
        prevUserSelect = docElemStyle.userSelect
        docElemStyle.userSelect = 'none'
      }
      if (opts.handleActiveBackground) {
        target.style.background = opts.handleActiveBackground
      }

      // 拖动过程中每帧最多提交一次列宽，松手时补交最后一次
      let pending: number[] | null = null
      let frame = 0
      const flush = () => {
        frame = 0
        if (pending != null) {
          const nextSizes = pending
          pending = null
          onChangeSizes(nextSizes)
        }
      }
      const onMove = (ev: PointerEvent) => {
        pending = computeSizes(startIndex, endIndex, ev.clientX - startX)
        if (frame === 0) {
          frame = requestAnimationFrame(flush)
        }
      }

      const stop: StopResize = (commit) => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onEnd)
        window.removeEventListener('pointercancel', onEnd)
        cancelAnimationFrame(frame)
        if (commit) {
          flush()
        }
        if (disableUserSelectWhenResizing) {
          docElemStyle.userSelect = prevUserSelect
        }
        if (opts.handleActiveBackground) {
          target.style.background = ''
        }
      }
      const onEnd = () => {
        stop(true)
        onFinish()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onEnd)
      return stop
    }

    const resizedColumns = makeRecursiveMapper<ArtColumn>((col, { startIndex, endIndex }) => {
        const prevTitle = internals.safeRenderHeader(col)

        return {
          ...col,
          width: sizes[startIndex],
          title: (
            <>
              {prevTitle}
              <ColumnResizeHandle
                className="resize-handle"
                var-handleBackground={opts.handleBackground}
                var-handleHoverBackground={opts.handleHoverBackground}
                onStartResize={(e, onFinish) => startResize(startIndex, endIndex, e, onFinish)}
              />
            </>
          ),
          headerCellProps: mergeCellProps(col.headerCellProps, {
            style: {
              overflow: 'visible',
              position: 'relative',
            },
          }),
        }
    })(columns)

    return pipeline.columns(fillColumn == null ? resizedColumns : appendFillRemainingWidthColumn(resizedColumns, fillColumn))
  }
}
