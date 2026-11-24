import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { BaseTable } from '../table'
import { Classes } from '../styles'

const lockedColumns = [
  { code: 'idx', name: '序号', width: 60, lock: true },
  { code: 'col1', name: '列1', width: 200 },
  { code: 'col2', name: '列2', width: 200 },
  { code: 'col3', name: '列3', width: 200 },
  { code: 'op', name: '操作', width: 180, lock: true },
]

const sampleRows = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  idx: i + 1,
  col1: `A-${i}`,
  col2: `B-${i}`,
  col3: `C-${i}`,
  op: '查看',
}))

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  container.style.width = '500px'
  container.style.height = '300px'
  document.body.appendChild(container)
})

afterEach(() => {
  ReactDOM.unmountComponentAtNode(container)
  container.remove()
})

function mockHorizontalOverflow(tableBody: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(tableBody, 'scrollWidth', { configurable: true, value: scrollWidth })
  Object.defineProperty(tableBody, 'clientWidth', { configurable: true, value: clientWidth })
}

function mount(props: Record<string, unknown>) {
  act(() => {
    ReactDOM.render(
      React.createElement(BaseTable as any, {
        primaryKey: 'id',
        columns: lockedColumns,
        ...props,
      }),
      container,
    )
  })
}

test('art-table establishes a positioning context so lock shadows span the full scrolled table height under useOutterHeight', () => {
  mount({
    dataSource: sampleRows,
    useOutterHeight: true,
    style: { height: 300, overflow: 'auto' },
  })

  const artTable = container.querySelector(`.${Classes.artTable}`) as HTMLElement
  const loadingWrapper = container.querySelector(`.${Classes.loadingWrapper}`) as HTMLElement

  expect(getComputedStyle(artTable).position).toBe('relative')
  // Non-empty useOutterHeight tables must not cap loadingWrapper height to 100% of the viewport;
  // otherwise absolute overlays truncate when vertically scrolling.
  expect(getComputedStyle(loadingWrapper).height).not.toBe('100%')
  expect(getComputedStyle(loadingWrapper).minHeight).toBe('100%')
})

test('empty table with useOutterHeight keeps loadingWrapper at height: 100% for centered empty content', () => {
  mount({
    dataSource: [],
    useOutterHeight: true,
    style: { height: 300, overflow: 'auto' },
  })

  const loadingWrapper = container.querySelector(`.${Classes.loadingWrapper}`) as HTMLElement
  expect(getComputedStyle(loadingWrapper).height).toBe('100%')
})

test('empty table hides lock shadow masks and clears show-shadow even when columns overflow horizontally, then restores them once data arrives', () => {
  mount({
    dataSource: [],
    useOutterHeight: true,
    style: { height: 300, overflow: 'auto' },
  })

  const tableBody = container.querySelector(`.${Classes.tableBody}`) as HTMLElement
  mockHorizontalOverflow(tableBody, 840, 500)

  // Trigger horizontal scroll sync while empty
  act(() => {
    tableBody.scrollLeft = 40
    tableBody.dispatchEvent(new Event('scroll'))
  })

  const masks = Array.from(container.querySelectorAll(`.${Classes.lockShadowMask}`)) as HTMLElement[]
  const leftShadow = container.querySelector(`.${Classes.leftLockShadow}`) as HTMLElement
  const rightShadow = container.querySelector(`.${Classes.rightLockShadow}`) as HTMLElement

  expect(masks.length).toBe(2)
  for (const mask of masks) {
    expect(getComputedStyle(mask).display).toBe('none')
  }
  expect(leftShadow.classList.contains('show-shadow')).toBe(false)
  expect(rightShadow.classList.contains('show-shadow')).toBe(false)

  // Populate rows -> lock shadows must become visible again
  mount({
    dataSource: sampleRows,
    useOutterHeight: true,
    style: { height: 300, overflow: 'auto' },
  })

  const populatedBody = container.querySelector(`.${Classes.tableBody}`) as HTMLElement
  mockHorizontalOverflow(populatedBody, 840, 500)
  act(() => {
    populatedBody.scrollLeft = 40
    populatedBody.dispatchEvent(new Event('scroll'))
  })

  for (const mask of masks) {
    expect(getComputedStyle(mask).display).not.toBe('none')
  }
  expect(leftShadow.classList.contains('show-shadow')).toBe(true)
  expect(rightShadow.classList.contains('show-shadow')).toBe(true)

  // Clear rows again -> lock shadows must disappear cleanly
  mount({
    dataSource: [],
    useOutterHeight: true,
    style: { height: 300, overflow: 'auto' },
  })
  expect(leftShadow.classList.contains('show-shadow')).toBe(false)
  expect(rightShadow.classList.contains('show-shadow')).toBe(false)
})

function getMatchingCssRules(el: Element): CSSStyleRule[] {
  const matched: CSSStyleRule[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText) {
        try {
          if (el.matches(rule.selectorText)) {
            matched.push(rule)
          }
        } catch {
          // ignore non-standard selectors
        }
      }
    }
  }
  return matched
}

test('empty table with useOutterHeight removes placeholder cell borders so no line cuts through the centered empty state', () => {
  mount({
    dataSource: [],
    useOutterHeight: true,
    useOuterBorder: false,
    emptyCellHeight: 144,
    style: { height: 300, overflow: 'auto' },
  })

  const emptyTd = container.querySelector(`.${Classes.tableBody} tbody tr.last td`) as HTMLElement
  expect(emptyTd).not.toBeNull()
  const matched = getMatchingCssRules(emptyTd)
  const resetRule = matched.find(
    (r) =>
      r.selectorText.includes('use-outer-height') &&
      r.selectorText.includes('empty') &&
      /border-bottom:\s*none/i.test(r.cssText) &&
      /border-right:\s*none/i.test(r.cssText),
  )
  expect(resetRule).toBeDefined()
})

test('existing non-useOutterHeight empty table without useOuterBorder preserves its original cell border behavior', () => {
  mount({
    dataSource: [],
    useOutterHeight: false,
    useOuterBorder: false,
    emptyCellHeight: 144,
  })

  const emptyTd = container.querySelector(`.${Classes.tableBody} tbody tr.last td`) as HTMLElement
  expect(emptyTd).not.toBeNull()
  const matched = getMatchingCssRules(emptyTd)
  const removesBottomBorder = matched.some((r) => /border-bottom:\s*none/i.test(r.cssText))
  expect(removesBottomBorder).toBe(false)
})
