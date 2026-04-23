import { ArtColumn } from '../../../interfaces'
import {
  filterDataSourceByFilterData,
  normalizeFilterData,
  resolveFilterDataSource,
  updateFilterData,
} from '../filterModeUtils'

test('normalizeFilterData removes blank values and keeps the latest item for the same code', () => {
  expect(
    normalizeFilterData([
      { code: 'status', filterValue: 'Healthy' },
      { code: 'status', filterValue: 'Risk' },
      { code: 'owner', filterValue: '   ' },
      { code: 'region', filterValue: 123 },
    ]),
  ).toEqual([
    { code: 'status', filterValue: 'Risk' },
    { code: 'region', filterValue: '123' },
  ])
})

test('updateFilterData upserts and clears a filter item by code', () => {
  const next = updateFilterData([{ code: 'status', filterValue: 'Healthy' }], 'region', '华东')
  expect(next).toEqual([
    { code: 'status', filterValue: 'Healthy' },
    { code: 'region', filterValue: '华东' },
  ])

  expect(updateFilterData(next, 'status', '')).toEqual([{ code: 'region', filterValue: '华东' }])
})

test('filterDataSourceByFilterData uses case-insensitive fuzzy match by default', () => {
  const columns: ArtColumn[] = [
    { name: '状态', code: 'status', filterProps: { dataSource: ['Healthy', 'Risk'] } },
    { name: '区域', code: 'region', filterProps: { dataSource: ['华东', '华南'] } },
  ]

  const dataSource = [
    { id: '1', status: 'Healthy', region: '华东' },
    { id: '2', status: 'Risk', region: '华南' },
    { id: '3', status: 'Watching', region: '华东' },
  ]

  expect(
    filterDataSourceByFilterData(dataSource, columns, [
      { code: 'status', filterValue: 'heal' },
      { code: 'region', filterValue: '华' },
    ]),
  ).toEqual([{ id: '1', status: 'Healthy', region: '华东' }])
})

test('filterDataSourceByFilterData prefers custom filterOptions when provided', () => {
  const columns: ArtColumn[] = [
    {
      name: '件数',
      code: 'stock',
      filterProps: {
        filterOptions(inputValue, record) {
          return Number(record.stock) >= Number(inputValue)
        },
      },
    },
  ]

  const dataSource = [
    { id: '1', stock: 120 },
    { id: '2', stock: 80 },
    { id: '3', stock: 160 },
  ]

  expect(filterDataSourceByFilterData(dataSource, columns, [{ code: 'stock', filterValue: '100' }])).toEqual([
    { id: '1', stock: 120 },
    { id: '3', stock: 160 },
  ])
})

test('resolveFilterDataSource filters dataSource locally by default', () => {
  const columns: ArtColumn[] = [
    {
      name: '状态',
      code: 'status',
      filterProps: { dataSource: ['Healthy', 'Risk'], showSearch: false },
    },
    { name: 'Owner', code: 'owner' },
  ]
  const dataSource = [
    { id: '1', status: 'Healthy', owner: 'Ada' },
    { id: '2', status: 'Risk', owner: 'Neo' },
  ]

  expect(
    resolveFilterDataSource(dataSource, columns, [{ code: 'status', filterValue: 'Risk' }], false),
  ).toEqual([{ id: '2', status: 'Risk', owner: 'Neo' }])
})

test('resolveFilterDataSource keeps dataSource unchanged when keepDataSource is enabled', () => {
  const columns: ArtColumn[] = [
    {
      name: '状态',
      code: 'status',
      filterProps: { dataSource: ['Healthy', 'Risk'] },
    },
  ]
  const dataSource = [
    { id: '1', status: 'Healthy' },
    { id: '2', status: 'Risk' },
  ]

  expect(resolveFilterDataSource(dataSource, columns, [{ code: 'status', filterValue: 'Risk' }], true)).toBe(dataSource)
})
