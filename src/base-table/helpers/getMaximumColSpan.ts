import { isFillRemainingWidthColumn } from '../../fillRemainingWidth'
import { ArtColumn } from '../../interfaces'
import { HorizontalRenderRange, VisibleColumnDescriptor } from '../interfaces'

const colSpanUpperBoundDisabled = Number.POSITIVE_INFINITY

export function getMaximumColSpan(params: {
  column: ArtColumn
  colIndex: number
  leftFlatCount: number
  horizontalRenderRange: HorizontalRenderRange
  visible: VisibleColumnDescriptor[]
}) {
  const { column, colIndex, leftFlatCount, horizontalRenderRange, visible } = params

  if (isFillRemainingWidthColumn(column)) {
    return colSpanUpperBoundDisabled
  }

  let maxColSpan = leftFlatCount + horizontalRenderRange.rightIndex - colIndex
  const visibleFillDescriptor = visible.find(
    (descriptor) => descriptor.type === 'normal' && isFillRemainingWidthColumn(descriptor.col),
  )
  const visibleFillColumnIndex =
    visibleFillDescriptor != null && visibleFillDescriptor.type === 'normal' ? visibleFillDescriptor.colIndex : undefined

  // fill 列只有在当前渲染窗口已经覆盖到 center 尾部时，才能安全参与跨列合并
  if (visibleFillColumnIndex != null && horizontalRenderRange.rightBlank === 0 && colIndex < visibleFillColumnIndex) {
    maxColSpan = Math.max(maxColSpan, visibleFillColumnIndex + 1 - colIndex)
  }

  return maxColSpan
}
