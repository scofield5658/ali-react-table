import { ArtColumn } from '../interfaces'
import { getColumnLogicWidth, isFillRemainingWidthColumn, takeFillRemainingWidthColumn } from '../fillRemainingWidth'
import { collectNodes, isLeafNode } from '../utils'
import {
  HorizontalRenderRange,
  RenderInfo,
  ResolvedUseVirtual,
  VirtualEnum,
  VisibleColumnDescriptor,
} from './interfaces'
import { BaseTable } from './table'
import { AUTO_VIRTUAL_THRESHOLD, OVERSCAN_SIZE, sum } from './utils'

function resolveVirtualEnabled(virtualEnum: VirtualEnum, defaultValue: boolean) {
  if (virtualEnum == null || virtualEnum === 'auto') {
    return defaultValue
  }
  return virtualEnum
}

let lockColumnNeedSpecifiedWidthWarned = false
function warnLockColumnNeedSpecifiedWidth(column: ArtColumn) {
  if (!lockColumnNeedSpecifiedWidthWarned) {
    lockColumnNeedSpecifiedWidthWarned = true
    console.warn('[srp-table] lock=true 的列需要指定宽度', column)
  }
}

let columnHiddenDeprecatedWarned = false
function warnColumnHiddenDeprecated(column: ArtColumn) {
  if (!columnHiddenDeprecatedWarned) {
    columnHiddenDeprecatedWarned = true
    console.warn('[srp-table] column.hidden 已经过时，如果需要隐藏该列，请将其从 columns 数组中移除', column)
  }
}

/** 检查列配置 & 设置默认宽度 & 剔除隐藏的列 */
function processColumns(columns: ArtColumn[], defaultColumnWidth: number) {
  if (columns == null || !Array.isArray(columns)) {
    console.warn('[srp-table] <BaseTable /> props.columns 需要传入一个数组', columns)
    columns = []
  }

  function dfs(columns: ArtColumn[]): ArtColumn[] {
    const result: ArtColumn[] = []

    for (let column of columns) {
      if (column.width == null && !isFillRemainingWidthColumn(column)) {
        if (defaultColumnWidth != null) {
          column = { ...column, width: defaultColumnWidth }
        } else if (process.env.NODE_ENV !== 'production' && isLeafNode(column) && column.lock) {
          warnLockColumnNeedSpecifiedWidth(column)
        }
      }

      if (isLeafNode(column)) {
        if (column.hidden) {
          // 被隐藏的列 会在这里被剔除
          warnColumnHiddenDeprecated(column)
        } else {
          result.push(column)
        }
      } else {
        const nextChildren = dfs(column.children)
        // 如果 nextChildren 为空，说明所有的子节点均被隐藏了，在这里隐藏父节点
        if (nextChildren.length > 0) {
          result.push({ ...column, children: nextChildren })
        }
      }
    }
    return result
  }

  return dfs(columns)
}

function getLeftNestedLockCount(columns: ArtColumn[]) {
  let nestedCount = 0

  for (const col of columns) {
    if (isLock(col)) {
      nestedCount += 1
    } else {
      break
    }
  }
  return nestedCount

  function isLock(col: ArtColumn): boolean {
    if (isLeafNode(col)) {
      return col.lock
    } else {
      return col.lock || col.children.some(isLock)
    }
  }
}

function getHorizontalRenderRange({
  offsetX,
  maxRenderWidth,
  center,
  useVirtual,
}: {
  offsetX: number
  maxRenderWidth: number
  center: ArtColumn[]
  useVirtual: ResolvedUseVirtual
}): HorizontalRenderRange {
  if (!useVirtual.horizontal) {
    return { leftIndex: 0, leftBlank: 0, rightIndex: center.length, rightBlank: 0 }
  }

  let leftIndex = 0
  let centerCount = 0
  let leftBlank = 0
  let centerRenderWidth = 0

  const overscannedOffsetX = Math.max(0, offsetX - OVERSCAN_SIZE)
  while (leftIndex < center.length) {
    const col = center[leftIndex]
    const colWidth = getColumnLogicWidth(col)
    if (colWidth + leftBlank < overscannedOffsetX) {
      leftIndex += 1
      leftBlank += colWidth
    } else {
      break
    }
  }

  // 考虑 over scan 之后，中间部分的列至少需要渲染的宽度
  const minCenterRenderWidth = maxRenderWidth + (overscannedOffsetX - leftBlank) + 2 * OVERSCAN_SIZE

  while (leftIndex + centerCount < center.length) {
    const col = center[leftIndex + centerCount]
    const colWidth = getColumnLogicWidth(col)
    if (colWidth + centerRenderWidth < minCenterRenderWidth) {
      centerRenderWidth += colWidth
      centerCount += 1
    } else {
      break
    }
  }

  const rightBlankCount = center.length - leftIndex - centerCount
  const rightBlank = sum(center.slice(center.length - rightBlankCount).map(getColumnLogicWidth))
  return {
    leftIndex: leftIndex,
    leftBlank,
    rightIndex: leftIndex + centerCount,
    rightBlank,
  }
}

// 一顿计算，将表格本次渲染所需要的数据都给算出来（代码写得有点乱，有较大优化空间）
// todo 可以考虑下将 header 部分的计算逻辑也放到这个文件中，目前应该有一些重复的计算逻辑
export function calculateRenderInfo(table: BaseTable): RenderInfo {
  const { offsetX, maxRenderWidth } = table.state

  const {
    useVirtual: useVirtualProp,
    hozVirtualThreshold = AUTO_VIRTUAL_THRESHOLD,
    verVirtualThreshold = AUTO_VIRTUAL_THRESHOLD,
    columns: columnsProp,
    dataSource: dataSourceProp,
    defaultColumnWidth,
  } = table.props

  const columns = processColumns(columnsProp, defaultColumnWidth)
  const leftNestedLockCount = getLeftNestedLockCount(columns)
  const fullFlat = collectNodes(columns, 'leaf-only')
  const { columns: fullFlatWithoutFill } = takeFillRemainingWidthColumn(fullFlat)

  let flat: RenderInfo['flat']
  let nested: RenderInfo['nested']
  let useVirtual: RenderInfo['useVirtual']

  if (leftNestedLockCount === columns.length) {
    flat = { left: [], right: [], full: fullFlat, center: fullFlat }
    nested = { left: [], right: [], full: columns, center: columns }
    useVirtual = { horizontal: false, vertical: false, header: false }
  } else {
    const leftNested = columns.slice(0, leftNestedLockCount)
    const rightNestedLockCount = getLeftNestedLockCount(columns.slice().reverse())
    const centerNested = columns.slice(leftNestedLockCount, columns.length - rightNestedLockCount)
    const rightNested = columns.slice(columns.length - rightNestedLockCount)

    const shouldEnableHozVirtual =
      fullFlat.length >= hozVirtualThreshold && fullFlatWithoutFill.every((col) => col.width != null)
    const shouldEnableVerVirtual = dataSourceProp.length >= verVirtualThreshold

    useVirtual = {
      horizontal: resolveVirtualEnabled(
        typeof useVirtualProp === 'object' ? useVirtualProp.horizontal : useVirtualProp,
        shouldEnableHozVirtual,
      ),
      vertical: resolveVirtualEnabled(
        typeof useVirtualProp === 'object' ? useVirtualProp.vertical : useVirtualProp,
        shouldEnableVerVirtual,
      ),
      header: resolveVirtualEnabled(typeof useVirtualProp === 'object' ? useVirtualProp.header : useVirtualProp, false),
    }

    flat = {
      left: collectNodes(leftNested, 'leaf-only'),
      full: fullFlat,
      right: collectNodes(rightNested, 'leaf-only'),
      center: collectNodes(centerNested, 'leaf-only'),
    }

    nested = {
      left: leftNested,
      full: columns,
      right: rightNested,
      center: centerNested,
    }
  }

  const { columns: centerFlat, fillColumn: centerFillColumn } = takeFillRemainingWidthColumn(flat.center)

  const horizontalRenderRange = getHorizontalRenderRange({ maxRenderWidth, offsetX, useVirtual, center: centerFlat })
  const verticalRenderRange = table.getVerticalRenderRange(useVirtual)

  const { leftBlank, leftIndex, rightBlank, rightIndex } = horizontalRenderRange
  const unfilteredVisibleColumnDescriptors: VisibleColumnDescriptor[] = [
    ...flat.left.map((col, i) => ({ type: 'normal', col, colIndex: i } as const)),
    leftBlank > 0 && { type: 'blank', blankSide: 'left', width: leftBlank },
    ...centerFlat
      .slice(leftIndex, rightIndex)
      .map((col, i) => ({ type: 'normal', col, colIndex: flat.left.length + leftIndex + i } as const)),
    rightBlank > 0 && { type: 'blank', blankSide: 'right', width: rightBlank },
    centerFillColumn && {
      type: 'normal',
      col: centerFillColumn,
      colIndex: fullFlat.indexOf(centerFillColumn),
    },
    ...flat.right.map(
      (col, i) => ({ type: 'normal', col, colIndex: flat.full.length - flat.right.length + i } as const),
    ),
  ]
  const visibleColumnDescriptors = unfilteredVisibleColumnDescriptors.filter(Boolean)

  const fullFlatCount = flat.full.length
  const leftFlatCount = flat.left.length
  const rightFlatCount = flat.right.length

  const stickyLeftMap = new Map<number, number>()
  let stickyLeft = 0
  for (let i = 0; i < leftFlatCount; i++) {
    stickyLeftMap.set(i, stickyLeft)
    stickyLeft += getColumnLogicWidth(flat.full[i])
  }

  const stickyRightMap = new Map<number, number>()
  let stickyRight = 0
  for (let i = 0; i < rightFlatCount; i++) {
    stickyRightMap.set(fullFlatCount - 1 - i, stickyRight)
    stickyRight += getColumnLogicWidth(flat.full[fullFlatCount - 1 - i])
  }

  const leftLockTotalWidth = sum(flat.left.map(getColumnLogicWidth))
  const rightLockTotalWidth = sum(flat.right.map(getColumnLogicWidth))

  return {
    horizontalRenderRange,
    verticalRenderRange,
    visible: visibleColumnDescriptors,
    flat,
    nested,
    useVirtual,
    stickyLeftMap,
    stickyRightMap,
    leftLockTotalWidth,
    rightLockTotalWidth,
    hasLockColumn: nested.left.length > 0 || nested.right.length > 0,
  }
}
