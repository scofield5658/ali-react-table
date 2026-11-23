import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { ArtColumn } from '../../../interfaces'
import { useTablePipeline } from '../../pipeline'
import { columnResize, ColumnResizeFeatureOptions } from '../columnResize'

let frames: Array<FrameRequestCallback | null> = []
const realRaf = window.requestAnimationFrame
const realCaf = window.cancelAnimationFrame

function runFrames() {
  const pending = frames
  frames = []
  pending.forEach((cb) => cb?.(0))
}

function fire(target: EventTarget, type: string, init: MouseEventInit = {}) {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }))
  })
}

const columns: ArtColumn[] = [
  { code: 'a', name: 'A', width: 100 },
  { code: 'b', name: 'B', width: 120 },
]

function Header({ opts }: { opts: ColumnResizeFeatureOptions }) {
  const pipeline = useTablePipeline()
  pipeline.input({ dataSource: [], columns }).use(columnResize(opts))
  return React.createElement(
    'div',
    null,
    pipeline
      .getColumns()
      .map((col) => React.createElement('div', { key: col.code, className: 'th', 'data-width': col.width }, col.title)),
  )
}

let container: HTMLDivElement

function mount(opts: ColumnResizeFeatureOptions) {
  act(() => {
    ReactDOM.render(React.createElement(Header, { opts }), container)
  })
  return container.querySelectorAll<HTMLSpanElement>('.resize-handle')
}

beforeEach(() => {
  frames = []
  window.requestAnimationFrame = (cb) => frames.push(cb)
  window.cancelAnimationFrame = (id) => {
    frames[id - 1] = null
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  document.documentElement.style.userSelect = ''
})

afterEach(() => {
  ReactDOM.unmountComponentAtNode(container)
  container.remove()
  window.requestAnimationFrame = realRaf
  window.cancelAnimationFrame = realCaf
})

test('a drag reports sizes at most once per frame and commits the last value on release', () => {
  const onChangeSizes = jest.fn()
  const [handle] = mount({ onChangeSizes })

  fire(handle, 'pointerdown', { clientX: 100 })
  expect(document.documentElement.style.userSelect).toBe('none')

  fire(window, 'pointermove', { clientX: 110 })
  fire(window, 'pointermove', { clientX: 130 })
  expect(onChangeSizes).not.toHaveBeenCalled()

  act(runFrames)
  expect(onChangeSizes).toHaveBeenCalledTimes(1)
  expect(onChangeSizes).toHaveBeenLastCalledWith([130, 120])

  fire(window, 'pointermove', { clientX: 150 })
  fire(window, 'pointerup', { clientX: 150 })
  expect(onChangeSizes).toHaveBeenCalledTimes(2)
  expect(onChangeSizes).toHaveBeenLastCalledWith([150, 120])
  expect(document.documentElement.style.userSelect).toBe('')

  act(runFrames)
  fire(window, 'pointermove', { clientX: 400 })
  act(runFrames)
  expect(onChangeSizes).toHaveBeenCalledTimes(2)
})

test('uncontrolled sizes follow the drag and respect minSize / maxSize', () => {
  const [handle] = mount({ minSize: 80, maxSize: 160 })
  const widths = () => [...container.querySelectorAll('.th')].map((el) => Number(el.getAttribute('data-width')))
  expect(widths()).toEqual([100, 120])

  fire(handle, 'pointerdown', { clientX: 100 })
  fire(window, 'pointermove', { clientX: 125 })
  act(runFrames)
  expect(widths()).toEqual([125, 120])

  fire(window, 'pointermove', { clientX: 0 })
  fire(window, 'pointerup', { clientX: 0 })
  expect(widths()).toEqual([80, 120])

  const [again] = container.querySelectorAll<HTMLSpanElement>('.resize-handle')
  fire(again, 'pointerdown', { clientX: 0 })
  fire(window, 'pointermove', { clientX: 500 })
  fire(window, 'pointerup', { clientX: 500 })
  expect(widths()).toEqual([160, 120])
})

test('pointercancel ends the drag like a release', () => {
  const onChangeSizes = jest.fn()
  const [, handle] = mount({ onChangeSizes })

  fire(handle, 'pointerdown', { clientX: 0 })
  fire(window, 'pointermove', { clientX: -30 })
  fire(window, 'pointercancel')
  expect(onChangeSizes).toHaveBeenLastCalledWith([100, 90])
  expect(document.documentElement.style.userSelect).toBe('')
})

test('only the primary button starts a drag', () => {
  const onChangeSizes = jest.fn()
  const [handle] = mount({ onChangeSizes })

  fire(handle, 'pointerdown', { clientX: 100, button: 2 })
  expect(document.documentElement.style.userSelect).toBe('')
  fire(window, 'pointermove', { clientX: 140 })
  fire(window, 'pointerup')
  expect(onChangeSizes).not.toHaveBeenCalled()
})

test('unmounting mid-drag releases the window listeners and restores user-select', () => {
  const onChangeSizes = jest.fn()
  const [handle] = mount({ onChangeSizes, handleActiveBackground: 'red' })

  fire(handle, 'pointerdown', { clientX: 100 })
  expect(handle.style.background).toBe('red')
  act(() => {
    ReactDOM.unmountComponentAtNode(container)
  })

  expect(document.documentElement.style.userSelect).toBe('')
  expect(handle.style.background).toBe('')
  fire(window, 'pointermove', { clientX: 160 })
  fire(window, 'pointerup')
  act(runFrames)
  expect(onChangeSizes).not.toHaveBeenCalled()
})

test('disableUserSelectWhenResizing: false leaves user-select alone', () => {
  const [handle] = mount({ disableUserSelectWhenResizing: false })
  document.documentElement.style.userSelect = 'text'
  fire(handle, 'pointerdown', { clientX: 100 })
  expect(document.documentElement.style.userSelect).toBe('text')
  fire(window, 'pointerup')
  expect(document.documentElement.style.userSelect).toBe('text')
})
