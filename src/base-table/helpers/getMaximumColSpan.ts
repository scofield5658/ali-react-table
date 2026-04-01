import { HorizontalRenderRange, VisibleColumnDescriptor } from '../interfaces'

export function getVisibleDescriptorLogicalRange(params: {
  descriptor: VisibleColumnDescriptor
  fullFlatCount: number
  leftFlatCount: number
  rightFlatCount: number
  horizontalRenderRange: HorizontalRenderRange
}) {
  const { descriptor, fullFlatCount, leftFlatCount, rightFlatCount, horizontalRenderRange } = params

  if (descriptor.type === 'normal') {
    return { left: descriptor.colIndex, right: descriptor.colIndex + 1 }
  }

  if (descriptor.blankSide === 'left') {
    return {
      left: leftFlatCount,
      right: leftFlatCount + horizontalRenderRange.leftIndex,
    }
  }

  return {
    left: leftFlatCount + horizontalRenderRange.rightIndex,
    right: fullFlatCount - rightFlatCount,
  }
}

export function getRenderedColSpan(params: {
  colIndex: number
  colSpan: number
  visible: VisibleColumnDescriptor[]
  fullFlatCount: number
  leftFlatCount: number
  rightFlatCount: number
  horizontalRenderRange: HorizontalRenderRange
}) {
  const { colIndex, colSpan, visible, fullFlatCount, leftFlatCount, rightFlatCount, horizontalRenderRange } = params
  const requestedRight = Math.max(colIndex + 1, Math.min(fullFlatCount, colIndex + Math.max(1, colSpan)))
  const startVisibleIndex = visible.findIndex((descriptor) => descriptor.type === 'normal' && descriptor.colIndex === colIndex)

  if (startVisibleIndex < 0) {
    return 1
  }

  let renderedColSpan = 0
  for (let visibleIndex = startVisibleIndex; visibleIndex < visible.length; visibleIndex++) {
    const descriptor = visible[visibleIndex]
    const range = getVisibleDescriptorLogicalRange({
      descriptor,
      fullFlatCount,
      leftFlatCount,
      rightFlatCount,
      horizontalRenderRange,
    })

    if (range.right <= colIndex) {
      continue
    }
    if (range.left >= requestedRight) {
      break
    }
    renderedColSpan += 1
  }

  return Math.max(1, renderedColSpan)
}
