import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'

/** Records every observation so the test can tell which ones are still active. */
class FakeResizeObserver {
  static active = new Set<FakeResizeObserver>()
  targets = new Set<Element>()
  constructor(readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.targets.add(target)
    FakeResizeObserver.active.add(this)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
    if (this.targets.size === 0) FakeResizeObserver.active.delete(this)
  }
  disconnect() {
    this.targets.clear()
    FakeResizeObserver.active.delete(this)
  }
}

// resize-observer-polyfill picks up a global ResizeObserver when it is first imported.
;(global as any).ResizeObserver = FakeResizeObserver
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BaseTable } = require('../table')

const columns = [
  { code: 'id', name: 'ID', width: 80 },
  { code: 'name', name: 'Name', width: 160 },
]
const rows = Array.from({ length: 300 }, (_, i) => ({ id: String(i), name: `row-${i}` }))

let container: HTMLDivElement
let scrollListeners: Set<EventListenerOrEventListenerObject>

beforeEach(() => {
  FakeResizeObserver.active.clear()
  container = document.createElement('div')
  container.style.overflow = 'auto'
  container.style.height = '200px'
  scrollListeners = new Set()
  const add = container.addEventListener.bind(container)
  const remove = container.removeEventListener.bind(container)
  container.addEventListener = (type: string, fn: any, opts?: any) => {
    if (type === 'scroll') scrollListeners.add(fn)
    add(type, fn, opts)
  }
  container.removeEventListener = (type: string, fn: any, opts?: any) => {
    if (type === 'scroll') scrollListeners.delete(fn)
    remove(type, fn, opts)
  }
  document.body.appendChild(container)
})

afterEach(() => {
  ReactDOM.unmountComponentAtNode(container)
  container.remove()
})

function mount(props: Record<string, unknown> = {}) {
  act(() => {
    ReactDOM.render(React.createElement(BaseTable, { primaryKey: 'id', columns, dataSource: rows, ...props }), container)
  })
}

test('a mounted table watches its scroll container while it is alive', () => {
  mount()
  expect(FakeResizeObserver.active.size).toBeGreaterThan(0)
  expect(scrollListeners.size).toBeGreaterThan(0)
})

test('unmounting releases every resize observer and scroll listener', () => {
  mount()
  act(() => {
    ReactDOM.unmountComponentAtNode(container)
  })
  expect(FakeResizeObserver.active.size).toBe(0)
  expect(scrollListeners.size).toBe(0)
})

test('re-rendering with new props keeps a single set of observers', () => {
  mount()
  const afterMount = FakeResizeObserver.active.size
  for (let i = 0; i < 5; i++) {
    mount({ dataSource: rows.slice(0, 200 + i) })
  }
  expect(FakeResizeObserver.active.size).toBe(afterMount)
  expect(scrollListeners.size).toBe(1)
})

test('mounting and unmounting repeatedly does not accumulate observers', () => {
  for (let i = 0; i < 10; i++) {
    mount()
    act(() => {
      ReactDOM.unmountComponentAtNode(container)
    })
  }
  expect(FakeResizeObserver.active.size).toBe(0)
  expect(scrollListeners.size).toBe(0)
})
