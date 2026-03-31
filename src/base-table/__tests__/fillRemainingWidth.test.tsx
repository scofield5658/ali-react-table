import { appendFillRemainingWidthColumn, isFillRemainingWidthColumn } from '../../fillRemainingWidth'
import { ArtColumn } from '../../interfaces'
import { calculateRenderInfo } from '../calculations'
import { getMaximumColSpan } from '../helpers/getMaximumColSpan'

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

test('getMaximumColSpan allows full-row span to include fill column when center tail is visible', () => {
  const columns = appendFillRemainingWidthColumn([
    {
      name: 'A',
      code: 'a',
      width: 120,
    },
    { name: 'B', code: 'b', width: 120 },
  ])

  const info = calculateRenderInfo(makeTable(columns, 480))
  const firstColumn = info.flat.full[0]

  expect(
    getMaximumColSpan({
      column: firstColumn,
      colIndex: 0,
      leftFlatCount: info.flat.left.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBe(3)
})

test('getMaximumColSpan does not cross hidden center columns to reach fill column', () => {
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
    getMaximumColSpan({
      column: visibleColumn!.col,
      colIndex: visibleColumn!.colIndex,
      leftFlatCount: info.flat.left.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBeLessThan(columns.length)
})

test('getMaximumColSpan keeps right lock columns at least one cell wide when rowSpan is enabled', () => {
  const columns: ArtColumn[] = [
    { name: 'A', code: 'a', width: 120 },
    { name: 'B', code: 'b', width: 120 },
    { name: 'C', code: 'c', width: 120 },
    { name: 'D', code: 'd', width: 120, lock: true },
  ]

  const info = calculateRenderInfo(makeTable(columns, 120))
  const rightLockColumn = info.flat.full[info.flat.full.length - 1]
  const rightLockIndex = info.flat.full.length - 1

  expect(
    getMaximumColSpan({
      column: rightLockColumn,
      colIndex: rightLockIndex,
      leftFlatCount: info.flat.left.length,
      horizontalRenderRange: info.horizontalRenderRange,
      visible: info.visible,
    }),
  ).toBe(1)
})
