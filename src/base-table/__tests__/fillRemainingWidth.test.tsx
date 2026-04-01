import { appendFillRemainingWidthColumn, isFillRemainingWidthColumn } from '../../fillRemainingWidth'
import { ArtColumn } from '../../interfaces'
import { calculateRenderInfo } from '../calculations'
import { getRenderedColSpan } from '../helpers/getMaximumColSpan'

function makeTable(columns: ArtColumn[], maxRenderWidth = 240) {
  return {
    props: {
      columns,
      dataSource: new Array(8).fill(null).map((_, index) => ({ id: String(index) })),
      useVirtual: 'auto',
      hozVirtualThreshold: 3,
      verVirtualThreshold: 100,
      defaultColumnWidth: 140,
    },
    state: {
      offsetX: 0,
      offsetY: 0,
      maxRenderWidth,
      maxRenderHeight: 600,
    },
    getVerticalRenderRange() {
      return {
        topIndex: 0,
        topBlank: 0,
        bottomIndex: 8,
        bottomBlank: 0,
      }
    },
  } as any
}

test('appendFillRemainingWidthColumn inserts before trailing right lock columns', () => {
  const columns: ArtColumn[] = [
    { name: '商品', code: 'product', width: 180 },
    { name: '金额', code: 'amount', width: 120, lock: true },
  ]

  const nextColumns = appendFillRemainingWidthColumn(columns)

  expect(nextColumns).toHaveLength(3)
  expect(isFillRemainingWidthColumn(nextColumns[1])).toBe(true)
  expect(nextColumns[2].lock).toBe(true)
})

test('calculateRenderInfo keeps fill column width empty and visible under auto virtual', () => {
  const columns = appendFillRemainingWidthColumn([
    { name: 'A', code: 'a', width: 120 },
    { name: 'B', code: 'b', width: 120 },
    { name: 'C', code: 'c', width: 120 },
    { name: 'D', code: 'd', width: 120 },
    { name: 'E', code: 'e', width: 120, lock: true },
  ])

  const info = calculateRenderInfo(makeTable(columns))
  const fillColumn = info.flat.full.find(isFillRemainingWidthColumn)

  expect(info.useVirtual.horizontal).toBe(true)
  expect(fillColumn).toBeDefined()
  expect(fillColumn.width).toBeUndefined()
  expect(info.visible.some((descriptor) => descriptor.type === 'normal' && isFillRemainingWidthColumn(descriptor.col))).toBe(
    true,
  )
  expect(Number.isFinite(info.leftLockTotalWidth)).toBe(true)
  expect(Number.isFinite(info.rightLockTotalWidth)).toBe(true)
})

test('getRenderedColSpan allows full-row span to include fill column when center tail is visible', () => {
  const columns = appendFillRemainingWidthColumn([
    {
      name: 'A',
      code: 'a',
      width: 120,
    },
    { name: 'B', code: 'b', width: 120 },
  ])

  const info = calculateRenderInfo(makeTable(columns, 480))

  expect(
    getRenderedColSpan({
      colIndex: 0,
      colSpan: 3,
      fullFlatCount: info.flat.full.length,
      leftFlatCount: info.flat.left.length,
      rightFlatCount: info.flat.right.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBe(3)
})

test('getRenderedColSpan does not cross hidden center columns to reach fill column unless requested span reaches it', () => {
  const columns = appendFillRemainingWidthColumn([
    { name: 'A', code: 'a', width: 120 },
    { name: 'B', code: 'b', width: 120 },
    { name: 'C', code: 'c', width: 120 },
    { name: 'D', code: 'd', width: 120 },
  ])

  const info = calculateRenderInfo(makeTable(columns, 120))
  const firstVisibleColumn = info.visible.find((descriptor) => descriptor.type === 'normal')
  const visibleColumn =
    firstVisibleColumn != null && firstVisibleColumn.type === 'normal' ? firstVisibleColumn : null

  expect(visibleColumn).not.toBeNull()
  expect(
    getRenderedColSpan({
      colIndex: visibleColumn!.colIndex,
      colSpan: 2,
      fullFlatCount: info.flat.full.length,
      leftFlatCount: info.flat.left.length,
      rightFlatCount: info.flat.right.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBeLessThan(columns.length)
})

test('getRenderedColSpan keeps right lock columns at least one cell wide when rowSpan is enabled', () => {
  const columns: ArtColumn[] = [
    { name: 'A', code: 'a', width: 120 },
    { name: 'B', code: 'b', width: 120 },
    { name: 'C', code: 'c', width: 120 },
    { name: 'D', code: 'd', width: 120, lock: true },
  ]

  const info = calculateRenderInfo(makeTable(columns, 120))
  const rightLockIndex = info.flat.full.length - 1

  expect(
    getRenderedColSpan({
      colIndex: rightLockIndex,
      colSpan: 4,
      fullFlatCount: info.flat.full.length,
      leftFlatCount: info.flat.left.length,
      rightFlatCount: info.flat.right.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBe(1)
})

test('getRenderedColSpan lets full-row detail span across visible right lock columns', () => {
  const columns: ArtColumn[] = [
    { name: 'A', code: 'a', width: 120 },
    { name: 'B', code: 'b', width: 120 },
    { name: 'C', code: 'c', width: 120 },
    { name: 'D', code: 'd', width: 120, lock: true },
  ]

  const info = calculateRenderInfo(makeTable(columns, 120))

  expect(
    getRenderedColSpan({
      colIndex: 0,
      colSpan: info.flat.full.length,
      fullFlatCount: info.flat.full.length,
      leftFlatCount: info.flat.left.length,
      rightFlatCount: info.flat.right.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBe(info.visible.length)
})

test('getRenderedColSpan supports open-ended full-row spans after fillRemainingWidth appends a fill column', () => {
  const columns = appendFillRemainingWidthColumn([
    { name: '订单', code: 'order', width: 120 },
    { name: '创建时间', code: 'createdAt', width: 120 },
    { name: '操作', code: 'action', width: 120, lock: true },
  ])

  const info = calculateRenderInfo(makeTable(columns, 120))

  expect(
    getRenderedColSpan({
      colIndex: 0,
      colSpan: Number.MAX_SAFE_INTEGER,
      fullFlatCount: info.flat.full.length,
      leftFlatCount: info.flat.left.length,
      rightFlatCount: info.flat.right.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBe(info.visible.length)
})
