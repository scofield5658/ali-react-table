import { ArtColumn } from './interfaces'
import { isLeafNode } from './utils'

const FEATURE_KEY = 'fillRemainingWidth'

export function isFillRemainingWidthColumn(column: Pick<ArtColumn, 'features'> | null | undefined) {
  return Boolean(column?.features?.[FEATURE_KEY])
}

export function getColumnLogicWidth(column: ArtColumn) {
  return isFillRemainingWidthColumn(column) ? 0 : column.width ?? 0
}

export function takeFillRemainingWidthColumn<T extends ArtColumn>(columns: T[]) {
  const fillIndex = columns.findIndex(isFillRemainingWidthColumn)

  if (fillIndex < 0) {
    return { columns, fillColumn: null as T | null }
  }

  return {
    columns: columns.filter((_, index) => index !== fillIndex),
    fillColumn: columns[fillIndex],
  }
}

export function appendFillRemainingWidthColumn(columns: ArtColumn[], extra: Partial<ArtColumn> = {}) {
  const normalized = columns.filter((column) => !isFillRemainingWidthColumn(column))
  const fillColumn = createFillRemainingWidthColumn(extra)

  let rightLockStart = normalized.length
  while (rightLockStart > 0 && isLockColumn(normalized[rightLockStart - 1])) {
    rightLockStart -= 1
  }

  return [...normalized.slice(0, rightLockStart), fillColumn, ...normalized.slice(rightLockStart)]
}

export function createFillRemainingWidthColumn(extra: Partial<ArtColumn> = {}): ArtColumn {
  const { features, ...rest } = extra

  return {
    name: '',
    title: '',
    ...rest,
    lock: false,
    width: undefined,
    getValue() {
      return ''
    },
    features: {
      noExport: true,
      ...features,
      [FEATURE_KEY]: true,
    },
  }
}

function isLockColumn(column: ArtColumn): boolean {
  if (isLeafNode(column)) {
    return Boolean(column.lock)
  }

  return Boolean(column.lock || column.children.some(isLockColumn))
}
