import { appendFillRemainingWidthColumn } from '../../fillRemainingWidth'
import { TablePipeline } from '../pipeline'

export function fillRemainingWidth() {
  return function fillRemainingWidthStep(pipeline: TablePipeline) {
    return pipeline.columns(appendFillRemainingWidthColumn(pipeline.getColumns()))
  }
}
