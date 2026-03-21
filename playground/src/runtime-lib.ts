export { BaseTable } from '../../src/base-table/table'
export { useTablePipeline } from '../../src/pipeline/pipeline'
import { rowDetail } from '../../src/pipeline/features/rowDetail'
import { sort } from '../../src/pipeline/features/sort'
import { treeMode } from '../../src/pipeline/features/treeMode'

export const features = {
  rowDetail,
  sort,
  treeMode,
} as const

export type { ArtColumn } from '../../src/interfaces'
export type { BaseTableProps } from '../../src/base-table/table'
