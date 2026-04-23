import React, { ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components'
import { icons } from '../../common-views'
import { ArtColumn } from '../../interfaces'
import { internals } from '../../internals'
import { isLeafNode } from '../../utils'
import { TablePipeline } from '../pipeline'
import {
  filterDataSourceByFilterData,
  FilterDataItem,
  getFilterableColumns,
  normalizeFilterData,
  updateFilterData,
} from './filterModeUtils'

export type { FilterDataItem } from './filterModeUtils'

type DivStyledProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>
type InputStyledProps = React.InputHTMLAttributes<HTMLInputElement>
type ButtonStyledProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>

const FilterHeaderShell = styled.div<DivStyledProps>`
  display: flex;
  align-items: center;
`

const FilterTrigger = styled.button<{ active: boolean } & ButtonStyledProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: ${(props) => (props.active ? '#23A3FF' : '#8c8c8c')};
  cursor: pointer;

  &:hover {
    color: ${(props) => (props.active ? '#23A3FF' : '#595959')};
  }
`

const FilterPanel = styled.div<DivStyledProps>`
  width: 160px;
  padding: 8px 8px 6px;
  box-sizing: border-box;
  color: #262626;
  font-size: 12px;
  line-height: 1.5;
`

const FilterInput = styled.input<InputStyledProps>`
  width: 100%;
  height: 28px;
  padding: 0 8px;
  box-sizing: border-box;
  border: 1px solid #d9d9d9;
  border-radius: 5px;
  outline: none;
  font-size: 12px;
  line-height: 1.5;

  &:focus {
    border-color: #23a3ff;
  }
`

const FilterOptionList = styled.div<DivStyledProps>`
  max-height: 136px;
  margin-top: 6px;
  overflow: auto;
`

const FilterOptionButton = styled.button<{ active: boolean } & ButtonStyledProps>`
  width: 100%;
  min-height: 28px;
  margin-top: 4px;
  padding: 3px 8px;
  box-sizing: border-box;
  border: 1px solid ${(props) => (props.active ? '#23A3FF' : '#e8e8e8')};
  border-radius: 5px;
  background: ${(props) => (props.active ? 'rgba(35, 163, 255, 0.12)' : '#fff')};
  color: #262626;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
`

const FilterActionRow = styled.div<DivStyledProps>`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 6px;
`

const FilterActionButton = styled.button<{ primary?: boolean } & ButtonStyledProps>`
  min-width: 44px;
  height: 26px;
  padding: 0 8px;
  box-sizing: border-box;
  border: 1px solid ${(props) => (props.primary ? '#23A3FF' : '#d9d9d9')};
  border-radius: 999px;
  background: ${(props) => (props.primary ? '#23A3FF' : '#fff')};
  color: ${(props) => (props.primary ? '#fff' : '#262626')};
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
`

const FilterEmptyState = styled.div<DivStyledProps>`
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.5;
`

export interface FilterModeFeatureOptions {
  /** (非受控用法) 默认的筛选条件 */
  defaultFilterData?: FilterDataItem[]

  /** (受控用法) 当前筛选条件 */
  filterData?: FilterDataItem[]

  /** 更新筛选条件的回调函数 */
  onChangeFilterData?(nextFilterData: FilterDataItem[]): void

  /** 是否保持 dataSource 不变 */
  keepDataSource?: boolean

  /** 弹层组件属性 */
  popoverProps?: any

  /** 自定义筛选表头 */
  FilterHeaderCell?: React.ComponentType<FilterHeaderCellProps>
}

export interface FilterHeaderCellProps {
  filterModeOptions: {
    keepDataSource: boolean
  }

  children: ReactNode
  column: ArtColumn
  filterValue: string
  active: boolean
  open: boolean
  setOpen(nextOpen: boolean): void
  filterPanel: ReactNode
  Popover: React.ComponentType<any>
  popoverProps?: any
}

const stateKey = 'filterMode'

export function filterMode(opts: FilterModeFeatureOptions = {}) {
  return function filterModeStep(pipeline: TablePipeline) {
    const inputFilterData = opts.filterData ?? pipeline.getStateAtKey(stateKey) ?? opts.defaultFilterData ?? []
    const filterData = normalizeFilterData(inputFilterData)
    const Popover = pipeline.ctx.components.Popover
    const columns = pipeline.getColumns()
    const filterableColumns = getFilterableColumns(columns)

    if (filterableColumns.length === 0) {
      return pipeline
    }

    if (Popover == null) {
      throw new Error('使用 filterMode 之前需要设置 pipeline.ctx.components.Popover')
    }

    const onChangeFilterData = (nextFilterData: FilterDataItem[]) => {
      const normalized = normalizeFilterData(nextFilterData)
      opts.onChangeFilterData?.(normalized)
      pipeline.setStateAtKey(stateKey, normalized)
    }

    if (!opts.keepDataSource) {
      pipeline.dataSource(filterDataSourceByFilterData(pipeline.getDataSource(), filterableColumns, filterData))
    }

    pipeline.columns(
      processColumns(columns, {
        filterData,
        onChangeFilterData,
        Popover,
        popoverProps: opts.popoverProps,
        keepDataSource: Boolean(opts.keepDataSource),
        FilterHeaderCell: opts.FilterHeaderCell ?? DefaultFilterHeaderCell,
      }),
    )

    return pipeline
  }
}

function stringifyFilterValue(value: any) {
  if (value == null) {
    return ''
  }
  return typeof value === 'string' ? value : String(value)
}

function isBlankFilterValue(value: any) {
  return stringifyFilterValue(value).trim() === ''
}

function processColumns(
  columns: ArtColumn[],
  {
    filterData,
    onChangeFilterData,
    Popover,
    popoverProps,
    keepDataSource,
    FilterHeaderCell,
  }: {
    filterData: FilterDataItem[]
    onChangeFilterData(nextFilterData: FilterDataItem[]): void
    Popover: React.ComponentType<any>
    popoverProps?: any
    keepDataSource: boolean
    FilterHeaderCell: React.ComponentType<FilterHeaderCellProps>
  },
) {
  const filterMap = new Map(filterData.map((item) => [item.code, stringifyFilterValue(item.filterValue)]))

  return columns.map(dfs)

  function dfs(col: ArtColumn): ArtColumn {
    const result = { ...col }

    if (isLeafNode(col) && col.code && col.filterProps) {
      const filterValue = filterMap.get(col.code) ?? ''
      result.title = (
        <ManagedFilterHeader
          Popover={Popover}
          FilterHeaderCell={FilterHeaderCell}
          column={col}
          filterModeOptions={{ keepDataSource }}
          filterValue={filterValue}
          popoverProps={popoverProps}
          onChangeFilterValue={(nextFilterValue) => {
            onChangeFilterData(updateFilterData(filterData, col.code, nextFilterValue))
          }}
        >
          {internals.safeRenderHeader(col)}
        </ManagedFilterHeader>
      )
    }

    if (!isLeafNode(col)) {
      result.children = col.children.map(dfs)
    }

    return result
  }
}

function ManagedFilterHeader({
  Popover,
  FilterHeaderCell,
  column,
  filterModeOptions,
  filterValue,
  popoverProps,
  onChangeFilterValue,
  children,
}: React.PropsWithChildren<{
  Popover: React.ComponentType<any>
  FilterHeaderCell: React.ComponentType<FilterHeaderCellProps>
  column: ArtColumn
  filterModeOptions: FilterHeaderCellProps['filterModeOptions']
  filterValue: string
  popoverProps?: any
  onChangeFilterValue(nextFilterValue: string): void
}>) {
  const [open, setOpen] = useState(false)
  const [draftValue, setDraftValue] = useState(filterValue)

  useEffect(() => {
    setDraftValue(filterValue)
  }, [filterValue])

  const showSearch = column.filterProps?.showSearch !== false
  const options = column.filterProps?.dataSource ?? []
  const active = !isBlankFilterValue(filterValue)
  const visibleOptions = options.filter((item) => {
    if (!showSearch || isBlankFilterValue(draftValue)) {
      return true
    }
    return item.toLowerCase().includes(draftValue.toLowerCase())
  })

  const filterPanel = (
    <FilterPanel
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
      }}
    >
      {showSearch ? (
        <FilterInput
          value={draftValue}
          placeholder={`筛选${column.name}`}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            event.stopPropagation()
            setDraftValue(event.target.value)
          }}
          onClick={(event: React.MouseEvent<HTMLInputElement>) => {
            event.stopPropagation()
          }}
        />
      ) : null}
      {options.length > 0 ? (
        <FilterOptionList>
          {visibleOptions.map((item) => (
            <FilterOptionButton
              key={item}
              type="button"
              active={draftValue === item}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation()
                setDraftValue(item)
              }}
            >
              {item}
            </FilterOptionButton>
          ))}
        </FilterOptionList>
      ) : null}
      {!showSearch && options.length === 0 ? <FilterEmptyState>当前列没有可选的预置筛选项。</FilterEmptyState> : null}
      {showSearch && options.length > 0 && visibleOptions.length === 0 ? <FilterEmptyState>没有匹配的预置筛选项。</FilterEmptyState> : null}
      <FilterActionRow>
        <FilterActionButton
          type="button"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation()
            setDraftValue('')
            onChangeFilterValue('')
            setOpen(false)
          }}
        >
          重置
        </FilterActionButton>
        <FilterActionButton
          primary
          type="button"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation()
            onChangeFilterValue(draftValue)
            setOpen(false)
          }}
        >
          确认
        </FilterActionButton>
      </FilterActionRow>
    </FilterPanel>
  )

  return (
    <FilterHeaderCell
      Popover={Popover}
      column={column}
      filterModeOptions={filterModeOptions}
      filterPanel={filterPanel}
      filterValue={filterValue}
      active={active}
      open={open}
      setOpen={setOpen}
      popoverProps={popoverProps}
    >
      {children}
    </FilterHeaderCell>
  )
}

function DefaultFilterHeaderCell({
  Popover,
  children,
  column,
  filterPanel,
  active,
  open,
  setOpen,
  popoverProps,
}: FilterHeaderCellProps) {
  const justifyContent = column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start'

  return (
    <FilterHeaderShell style={{ justifyContent }}>
      {children}
      <Popover visible={open} content={filterPanel} {...popoverProps}>
        <FilterTrigger
          active={active}
          type="button"
          aria-label={`筛选${column.name}`}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation()
            setOpen(!open)
          }}
        >
          <icons.Filter />
        </FilterTrigger>
      </Popover>
    </FilterHeaderShell>
  )
}
