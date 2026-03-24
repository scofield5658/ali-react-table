export { BaseTable } from '../../src/base-table/table'
export { useTablePipeline } from '../../src/pipeline/pipeline'
import { fillRemainingWidth } from '../../src/pipeline/features/fillRemainingWidth'
import { rowDetail } from '../../src/pipeline/features/rowDetail'
import { sort } from '../../src/pipeline/features/sort'
import { treeMode } from '../../src/pipeline/features/treeMode'

export const features = {
  fillRemainingWidth,
  rowDetail,
  sort,
  treeMode,
} as const

export type { ArtColumn } from '../../src/interfaces'
export type { BaseTableProps } from '../../src/base-table/table'
