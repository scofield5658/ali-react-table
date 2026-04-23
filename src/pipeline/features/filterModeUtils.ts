import { ArtColumn } from '../../interfaces'
import { collectNodes } from '../../utils'

export type FilterDataItem = { code: string; filterValue: any }

export function normalizeFilterData(filterData: FilterDataItem[]) {
  const filterMap = new Map<string, FilterDataItem>()

  for (const item of filterData ?? []) {
    if (item == null || typeof item.code !== 'string' || item.code.length === 0) {
      continue
    }

    if (isBlankFilterValue(item.filterValue)) {
      filterMap.delete(item.code)
      continue
    }

    filterMap.set(item.code, {
      code: item.code,
      filterValue: stringifyFilterValue(item.filterValue),
    })
  }

  return Array.from(filterMap.values())
}

export function updateFilterData(filterData: FilterDataItem[], code: string, nextFilterValue: any) {
  const nextFilterData = normalizeFilterData(filterData).filter((item) => item.code !== code)

  if (isBlankFilterValue(nextFilterValue)) {
    return nextFilterData
  }

  nextFilterData.push({
    code,
    filterValue: stringifyFilterValue(nextFilterValue),
  })

  return nextFilterData
}

export function getFilterableColumns(columns: ArtColumn[]) {
  return collectNodes(columns, 'leaf-only').filter((column) => column.code != null && column.filterProps != null)
}

export function filterDataSourceByFilterData(dataSource: any[], columns: ArtColumn[], filterData: FilterDataItem[]) {
  const activeFilterData = normalizeFilterData(filterData)
  if (activeFilterData.length === 0) {
    return dataSource
  }

  const filterColumnsMap = new Map(columns.map((column) => [column.code, column]))

  return dataSource.filter((record) => {
    return activeFilterData.every(({ code, filterValue }) => {
      const column = filterColumnsMap.get(code)
      if (column == null) {
        return true
      }
      return matchFilterValue(column, stringifyFilterValue(filterValue), record)
    })
  })
}

export function resolveFilterDataSource(
  dataSource: any[],
  columns: ArtColumn[],
  filterData: FilterDataItem[],
  keepDataSource?: boolean,
) {
  if (keepDataSource) {
    return dataSource
  }
  return filterDataSourceByFilterData(dataSource, columns, filterData)
}

function matchFilterValue(column: ArtColumn, filterValue: string, record: any) {
  if (isBlankFilterValue(filterValue)) {
    return true
  }

  const customFilter = column.filterProps?.filterOptions
  if (typeof customFilter === 'function') {
    return customFilter(filterValue, record)
  }

  const rawValue = record?.[column.code]
  if (rawValue == null) {
    return false
  }

  return String(rawValue).toLowerCase().includes(filterValue.toLowerCase())
}

function isBlankFilterValue(value: any) {
  return stringifyFilterValue(value).trim() === ''
}

function stringifyFilterValue(value: any) {
  if (value == null) {
    return ''
  }
  return typeof value === 'string' ? value : String(value)
}
