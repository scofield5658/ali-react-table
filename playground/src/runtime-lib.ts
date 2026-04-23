export { BaseTable } from '../../src/base-table/table'
export { useTablePipeline } from '../../src/pipeline/pipeline'
import { fillRemainingWidth } from '../../src/pipeline/features/fillRemainingWidth'
import { filterMode } from '../../src/pipeline/features/filterMode'
import { rowDetail } from '../../src/pipeline/features/rowDetail'
import { rowGrouping } from '../../src/pipeline/features/rowGrouping'
import { sort } from '../../src/pipeline/features/sort'
import { treeMode } from '../../src/pipeline/features/treeMode'

export const features = {
  fillRemainingWidth,
  filterMode,
  rowDetail,
  rowGrouping,
  sort,
  treeMode,
} as const

export type { ArtColumn } from '../../src/interfaces'
export type { BaseTableProps } from '../../src/base-table/table'
